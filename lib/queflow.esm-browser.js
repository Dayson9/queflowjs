 /*!
  * QueFlow.js
  * (c) 2024-now Sodiq Tunde (Dayson9)
  * Released under the MIT License.
  */
 'use-strict';

 // Counter for generating unique IDs for elements with reactive data.
 var counterQF = 0,
   nuggetCounter = 0;

 var stylesheet = {
   el: document.createElement("style"),
   isAppended: false
 };

 // Selects an element in the DOM using its data-qfid attribute.
 const selectElement = qfid => document.querySelector("[data-qfid=" + qfid + "]");

 function qfEvent(name, detail) {
   return new CustomEvent(name, {
     detail: detail
   });
 }

 // Filters out null elements from the given input [Array].
 function filterNullElements(input) {
   return input.filter((d) => {
     let el = selectElement(d.qfid);
     // If element exists, return its the corresponding array (d).
     if (el) {
       return d;
     }
   });
 }


 // Creates a reactive signal, a proxy object that automatically updates the DOM/Component when its values change.
 function createSignal(data, object) {
   const item = typeof data != "object" ? { value: data } : data;

   function createReactiveObject(obj) {
     if (typeof obj !== "object") return obj;

     return new Proxy(obj, {
       get(target, key) {
         return createReactiveObject(target[key]); // Make nested objects reactive
       },
       set(target, key, value) {
         const prev = target[key];
         target[key] = value; // Update the target object accordingly

         const host = object.host;
         key = (parseInt(key)) ? parseInt(key) : key;
         if (!host.isFrozen) {
           if (key > host.data.length - 1) {
             target[key] = value; // Update the target object accordingly
             host.render();
           } else {
             // Update the target object accordingly
             target[key] = value;
             updateComponent(key, host, prev, value);
           }
           host.renderEvent.key = key;
           host.renderEvent.value = value;
           const elem = typeof host.element == "string" ? document.getElementById(host.element) : host.element;
           if (elem) {
             elem.dispatchEvent(host.renderEvent);
           }
           return true;
         }
         return true;
       },
     });
   }

   return createReactiveObject(item);
 }

 const b = str => stringBetween(str, "{{", "}}");

 // Checks if a DOM element has child elements.
 function hasChildren(element) {
   let children = element.querySelectorAll("*") || 0;
   // Returns true if there are children otherwise false
   return children.length > 0 ? true : false;
 }


 // Extracts the string between two delimiters in a given string.
 function stringBetween(str, f, s) {

   let output = "";
   let indexF = str.indexOf(f) + 2,
     indexS = str.indexOf(s);
   output = str.slice(indexF, indexS);
   // Returns the extracted string.
   return !output ? "" : output;
 }

 // Sanitizes a string to prevent potential XSS attacks.
 function sanitizeString(str, shouldSkip) {
   const excluded_chars = [{ from: "<script>", to: "&lt;script&gt;" }, { from: "</script>", to: "&lt;/script&gt;" }];

   str = new String(str);

   for (const index in excluded_chars) {
     const { from, to } = excluded_chars[index];
     if (!shouldSkip && index !== 0)
       str = str.replaceAll(from, to);
   }

   return str.replace(/javascript:/gi, '');
 }


 // Evaluates a template string by replacing placeholders with their values.
 function evaluateTemplate(reff, instance) {
   let out = "";

   const regex = /\{\{[^\{\{]+\}\}/g;
   try {
     out = reff.replace(regex, (match) => {
       const ext = b(match.replace('&gt;', '>')),
         parse = () => Function('return ' + ext).call(instance),
         parsed = parse();

       const falsy = [undefined, NaN, null];
       let rendered = "";

       if (falsy.includes(parsed) && parsed != "0") {
         rendered = match;
       } else {
         rendered = parsed;
       }
       return rendered;
     })

   } catch (error) {
     // Prevents unnecessary errors 
     let reg = /Unexpected token/i;
     if (!reg.test(error))
       console.error("QueFlow Error:\nAn error occurred while parsing JSX/HTML:\n\n" + error);
   }


   // Returns the evaluated template string.
   return out;
 }


 // Gets the attributes of a DOM element.
 function getAttributes(el) {
   let arr = [];
   let att,
     i = 0,
     atts = el.attributes;
   let n = atts.length;
   try {
     // Iterates through all attributes of the element.
     for (i = 0; i < n; i++) {
       att = atts[i];
       // Adds the attribute name and value to the array.
       let name = att.nodeName,
         value = att.nodeValue.trim();

       arr.push({ attribute: name, value: value });
     }
   } catch (error) {
     throw new Error("QueFlow Error:\nAn error occurred while getting the attributes of " + el + ", " + error);
   }


   // Returns the array of attributes.
   return arr;
 }


 // Converts JSX/HTML string into plain HTML and Component data, handling placeholders.
 function jsxToHTML(jsx, instance, sub_id) {
   let parser = new DOMParser(),
     children = [],
     out = "",
     data = [];
   let d = parser.parseFromString(jsx, "text/html"),
     doc = d.body;


   try {
     let targetElements = doc.querySelectorAll("*");

     let ln = targetElements.length;
     // Iterates over target elements
     for (let i = 0; i < ln; i++) {
       let c = targetElements[i];

       if (sub_id && !c.hasAttribute("data-sub_id")) {
         c.dataset.sub_id = sub_id;
       }

       if (!hasChildren(c)) {
         data.push(...generateComponentData(c, false, instance));
       } else {
         data.push(...generateComponentData(c, true, instance));
       }
       // Remove duplicate innerText attribute
       c.removeAttribute("innertext");
     }
   } catch (error) {
     console.error("QueFlow Error:\nAn error occurred while processing JSX/HTML:\n" + error);
   }

   out = evaluateTemplate(doc.innerHTML, instance);

   // Remove temporary elements
   doc.remove();

   return [out, data];
 }


 //Compares two objects and checks if their key-value pairs are strictly same
 function isSame(obj1, obj2) {
   let key1 = Object.keys(obj1),
     key2 = Object.keys(obj2),
     result = false;

   // If their lengths isn't the same, the objects are different
   if (key1.length !== key2.length) {
     result = false;
   } else {
     // Else, iterate over the key-value pairs and compare
     for (key of key1) {
       if ((obj1[key] === obj2[key])) {
         result = true;
       } else {
         result = false;
         break;
       }
     }
   }

   // Return comparation output
   return result;
 }


 // Generates and returns dataQF property
 function generateComponentData(child, isParent, instance) {
   let arr = [],
     attr = getAttributes(child),
     id = child.dataset.qfid;

   const isSVGElement = child instanceof SVGElement;

   if (!isParent) {
     attr.push({ attribute: instance.useStrict ? "innerText" : "innerHTML", value: instance.useStrict ? child.innerText : child.innerHTML });
   }


   for (let { attribute, value } of attr) {
     value = value || "";
     let hasTemplate = (value.indexOf("{{") > -1 && value.indexOf("}}") > -1);

     if (!id && hasTemplate) {
       child.dataset.qfid = "qf" + counterQF;
       id = "qf" + counterQF;
       counterQF++;
     }

     if ((child.style[attribute] || child.style[attribute] === "") && !isSVGElement) {
       child.style[attribute] = evaluateTemplate(value, instance);
       if (attribute.toLowerCase() !== "src") {
         child.removeAttribute(attribute);
       }
     } else {
       child.setAttribute(attribute, evaluateTemplate(value, instance));
     }

     if (hasTemplate) {
       const _eval = evaluateTemplate(value, instance);
       if (_eval !== value) {
         ((child.style[attribute] || child.style[attribute] === "" && !isSVGElement) && attribute.toLowerCase() !== "src" || attribute === "filter") ? arr.push({ template: value, key: "style." + attribute, qfid: id }): arr.push({ template: value, key: attribute, qfid: id });
       }
     }
   }
   // Returns arr 
   return arr;
 }


 // Function to convert an object into a CSS string
 function objToStyle(selector = "", obj = {}, alt = "", shouldSwitch) {
   // Initialize the style string
   let style = "";

   // Check if the alt value is not a keyframe or font-face rule
   const compare = alt.indexOf("@keyframes") === -1 && alt.indexOf("@font-face") === -1;

   // Iterate over each property in the object
   for (const key in obj) {
     const value = obj[key],
       hasFontFace = key.indexOf("@font-face") > -1;
     // If the value is a string, append it to the style string
     if (typeof value === 'string') {
       // Determine the selector based on the value and alt
       let sel = typeof value == "string" || alt.indexOf('@media') > -1 ? selector : '';

       // Append the property and value to the style string, considering the shouldSwitch flag
       if (!shouldSwitch) {
         style += `\n${ compare && !hasFontFace ? sel : ""} ${key} {${value}}\n`;
       } else {
         style += `\n${key}${ compare ? sel : ""} {\n${value}}\n`;
       }

     } else {
       // If the value is an object, recursively call objToStyle
       style += `\n${key } {\n${objToStyle(selector, value, key)}\n}`;
     }
   }

   // Return the generated style string
   return style;
 }

 // Function to initiate the stylesheet
 function initiateStyleSheet(selector = "", instance = Object, shouldSwitch) {
   // Convert the instance's stylesheet into a CSS string
   let styles = objToStyle(selector, instance.stylesheet, "", shouldSwitch);

   // Append the styles to the stylesheet element
   (stylesheet.el).textContent += styles;

   // Append the stylesheet to the document head if not already appended
   if (!stylesheet.isAppended) {
     document.head.appendChild(stylesheet.el);
   }
 }


 function handleEventListener(parent, instance) {
   // Selects all child elements of parent
   const children = parent.querySelectorAll("*"),
     len = children.length;
   // Iterate through each child element
   for (let i = 0; i < len; i++) {
     let c = children[i];
     // Cache the attributes for faster access
     let attributes = getAttributes(c),
       atLen = attributes.length;

     // Loop through attributes
     for (let j = 0; j < atLen; j++) {
       const { attribute, value } = attributes[j];
       // Check if the attribute is an event name
       if (attribute.startsWith("on")) {
         const sub_id = c.dataset.sub_id;
         if (sub_id) {
           const _instance = Function("return " + sub_id)(),
             fun = Function("e", value).bind(_instance);
           c[attribute] = fun;
         } else {
           // Bind the function to the instance directly
           const fun = Function("e", value).bind(instance);
           c[attribute] = fun;
         }
       }
     }
     c.removeAttribute("data-sub_id");
   }
 }

 function getFirstElement(html) {
   const parser = new DOMParser(),
     parsed = parser.parseFromString(html, "text/html"),
     body = parsed.body;

   const firstElem = body.firstElementChild;
   if (!firstElem.id) {
     firstElem.id = "qfEl" + counterQF;
     counterQF++;
   }


   return [firstElem, body.innerHTML];
 }


 function update(child, key, evaluated) {
   if (key.indexOf("style.") > -1) {
     let sliced = key.slice(6);
     child.style[sliced] = evaluated;
   } else {
     if (!key.startsWith("on")) {
       if (!child.getAttribute(key)) {
         child[key] = evaluated;
       } else {
         child.setAttribute(key, evaluated);
       }
     } else {
       child.addEventListener(key.slice(2), evaluated);
     }
   }
 }


 // Checks if a template placeholder contains a key
 function needsUpdate(template, key) {
   if (!template.includes("{{") || !template.includes("}}")) return false;

   return (b(template).includes(key)) ? true : needsUpdate(template.replace("{{" + b(template) + "}}", b(template)), key);
 }

 // Updates a component based on changes made to it's data
 function updateComponent(ckey, obj, prev, _new) {
   if (prev !== _new) {
     // Filters Null elements from the Component
     obj.dataQF = filterNullElements(obj.dataQF);

     let { dataQF } = obj;

     for (let d of dataQF) {
       let { template, key, qfid } = d;
       let child = selectElement(qfid);

       if (needsUpdate(template, ckey)) {
         let evaluated = evaluateTemplate(template, obj);

         key = (key === "class") ? "className" : key;
         update(child, key, evaluated);
       }
     }
   }
 }

 function renderTemplate(input, props) {
   const regex = /\{\{[^\{\{]+\}\}/g;

   const output = input.replace(regex, (match) => {
     const extracted = b(match).trim();
     const value = props[extracted];
     return value ? sanitizeString(value, true) : `{{ ${extracted} }}`;
   });

   return output;
 }

 function initiateSubComponents(markup, isNugget) {
   const subRegex = new RegExp("<[A-Z]\\w+\/[>]", "g"),
     nuggetRegex = new RegExp("<([A-Z]\\w+)\\s*\\{[^>]*\\}\\s*\/>", "g");

   if (subRegex.test(markup) && !isNugget) {
     markup = markup.replace(subRegex, (match) => {
       let evaluated, subName;
       try {
         subName = match.slice(1, -2);
         const instance = Function("return " + subName)();
         evaluated = renderSubComponent(instance, subName);
       } catch (e) {
         console.error("QueFlow Error:\nAn error occured while rendering subComponent '" + subName + "'\n" + e);
       }
       return evaluated;
     });
   }

   if (nuggetRegex.test(markup)) {
     markup = markup.replace(nuggetRegex, (match) => {
       const whiteSpaceIndex = match.indexOf(" "),
         name = match.slice(1, whiteSpaceIndex),
         data = match.slice(whiteSpaceIndex, -2).trim();
       let evaluated;

       try {
         const [instance, d] = Function(`return [${name}, ${data}]`)();
         evaluated = renderNugget(instance, d);
       } catch (e) {
         console.error("QueFlow Error:\nAn error occured while rendering Nugget '" + name + "'\n" + e);
       }
       return evaluated;
     });
   }

   return lintPlaceholders(markup, isNugget);
 }


 function g(str, counter) {
   const parser = new DOMParser(),
     parsed = parser.parseFromString(str, "text/html"),
     body = parsed.body;

   const children = body.querySelectorAll("*");

   for (const child of children) {
     child.classList.add("nugget" + counter);
   }

   return body.innerHTML;
 }

 const lintPlaceholders = (html, isNugget) => {
   const attributeRegex = new RegExp("\\s\\w+\\s*[=]\\s*\\{\\{[^\\}\\}]+\\}\\}", "g"),
     eventRegex = new RegExp("\\s(on)\\w+\\s*[=]\\s*\\{\\{[^\\}\\}]+\\}\\}", "g");

   if (eventRegex.test(html) && !isNugget) {
     html = html.replace(eventRegex, (match) => {
       match = match.replaceAll("'", "\`");
       const rpl = match.replace("{{", "\'");
       return rpl.replace(/}}$/, "\'");
     });
   }

   if (attributeRegex.test(html)) {
     const out = html.replace(attributeRegex, (match) => {
       const rpl = match.replace("{{", '"{{');
       return rpl.replace(/}}$/, '}}"');
     });
     return out;
   } else {
     return html;
   }
 }

 const removeEvents = (nodeList) => {
   nodeList.forEach((child) => {
     const attributes = getAttributes(child);

     for (var { attribute, value } of attributes) {
       if (attribute.slice(0, 2) === "on") {
         const fn = child[attribute];
         child.removeEventListener(attribute, fn);
       }
     }
   });
 }

 const renderSubComponent = (instance, name) => {
   let template = "<div>" + (instance.template instanceof Function ? instance.template() : instance.template) + "</div>";

   template = initiateSubComponents(template);

   const [el, newTemplate] = getFirstElement(template);

   // Initiates sub-component's stylesheet 
   initiateStyleSheet(`#${el.id}`, instance);
   const rendered = jsxToHTML(newTemplate, instance, name);

   el.innerHTML = rendered[0];
   instance.dataQF = rendered[1];
   instance.element = el;

   return rendered[0];
 }

 class QComponent {
   constructor(selector = "", options = {}) {
     // Stores the element associated with a component
     this.element = typeof selector == "string" ? document.querySelector(selector) : selector;

     if (!this.element) throw new Error("QueFlow Error:\nElement selector '" + selector + "' is invalid");

     // Creates a reactive signal for the component's data.
     this.data = createSignal(options.data, { forComponent: true, host: this });

     // Asigns the value of this.data' to _data
     let _data = this.data;

     // Stores the options provided to the component.
     this.options = options;

     // Stores the current 'freeze status' of the component
     this.isFrozen = false;


     // Stores the component's stylesheet 
     this.stylesheet = options.stylesheet;

     // Stores the component's reactive elements data
     this.dataQF = [];

     this.renderEvent = qfEvent("qf:update", {
       key: "",
       value: ""
     });

     this.created = options.created;
     this.run = options.run;

     if (options.useStrict === true || options.useStrict === false) {
       this.useStrict = options.useStrict;
     } else {
       this.useStrict = true;
     }


     let id = this.element.id;
     if (!id) throw new Error("QueFlow Error:\nTo use component scoped stylesheets, component's element must have a valid id");

     // Initiates a component's stylesheet 
     initiateStyleSheet(`#${id}`, this);

     // Defines properties for the component instance.
     Object.defineProperties(this, {
       template: { value: this.options.template },
       data: {
         // Getters and setters for 'data' property 
         get: () => {
           return _data;
         },
         set: (data) => {
           // If 'data' is not same as 'this.data' and component is not frozem
           if (!isSame(data, this.data) && !this.isFrozen) {
             _data = createSignal(data, { forComponent: true, host: this });
             this.dataQF = filterNullElements(this.dataQF);
             this.render();
           }
           return true;
         },
         configurable: true
       }
     });

     if (this.created)
       this.created(this);

   }

   render() {
     let el = this.element;
     // Checks if the component's template is a string or a function.
     let template = this.template instanceof Function ? this.template() : this.template;
     // Initiate sub-components if they are available 
     template = initiateSubComponents(template);

     // Convert template to html 
     let rendered = jsxToHTML(template, this);

     // Set innerHTML attribute of component's element to the converted template
     el.innerHTML = rendered[0];

     this.dataQF = rendered[1];
     handleEventListener(el, this);

     if (this.run)
       this.run(this);
   }

   freeze() {
     // Freezes component
     this.isFrozen = true;
   }

   unfreeze() {
     // Unfreezes component
     this.isFrozen = false;
   }
   // removes the component's element from the DOM
   destroy() {
     const parent = [this.element, ...this.element.querySelectorAll('*')];
     removeEvents(parent);

     this.element.remove();
   }
 }


 class subComponent {
   constructor(name, options = {}) {
     if (name) {
       globalThis[name] = this;
     }

     this.name = name;
     this.template = options?.template;

     if (!this.template) throw new Error("QueFlow Error:\nTemplate not provided for Subcomponent " + name);

     this.element = "";
     // Creates a reactive signal for the subcomponent's data.
     this.data = createSignal(options.data, { forComponent: true, host: this });

     // Asigns the value of this.data' to _data
     let _data = this.data;

     // Stores the options provided to the component.
     this.options = options;

     // Stores the current 'freeze status' of the subcomponent
     this.isFrozen = false;

     // Stores the id of the subcomponent's mainelement 
     this.elemId = "";

     this.created = options.created;

     // Stores the subcomponent's stylesheet 
     this.stylesheet = options.stylesheet;

     // Stores the subcomponent's reactive elements data
     this.dataQF = [];

     this.renderEvent = qfEvent("qf:render");

     if (options.useStrict === true || options.useStrict === false) {
       this.useStrict = options.useStrict;
     } else {
       this.useStrict = true;
     }

     // Defines properties for the subcomponent instance.
     Object.defineProperties(this, {
       data: {
         // Getters and setters for 'data' property 
         get: () => {
           return _data;
         },
         set: (data) => {
           // If 'data' is not same as 'this.data' and component is not frozem
           if (!isSame(data, this.data) && !this.isFrozen) {
             _data = createSignal(data, { forComponent: true, host: this });
             this.dataQF = filterNullElements(this.dataQF);
             renderSubComponent(this, this.name);
           }
           return true;
         },
         configurable: true,
         mutable: false
       }
     });

     if (this.created) this.created(this);
   }

   freeze() {
     // Freezes component
     this.isFrozen = true;
   }

   unfreeze() {
     // Unfreezes component
     this.isFrozen = false;
   }
   // removes the component's element from the DOM
   destroy() {
     const all = [this.element, ...this.element.querySelectorAll('*')];
     // Removes event listeners attached to the component's element and its child nodes
     removeEvents(all);

     this.element.remove();
   }
 }


 class Template {
   /** Creates a class for managing templates
    * 
    * @param {String|Node} element    The element to mount template into
    * @param {String|Function} templateFunc    A function that returns string to make into a template
    */
   constructor(el, stylesheet, templateFunc) {
     this.element = typeof el == "string" ? document.querySelector(el) : el;

     this.template = templateFunc;
     this.stylesheet = stylesheet;

     let id = this.element.id;

     if (!id) throw new Error("QueFlow Error:\nTo use template scoped stylesheets, template's element must have a valid id");

     // Initiates a component's stylesheet 
     initiateStyleSheet(`#${id}`, this);

   }

   renderWith(data, position = "append") {
     let template = (this.template instanceof Function) ? this.template(data) : this.template;

     let rendered = renderTemplate(template, data),
       r = jsxToHTML(rendered),
       el = this.element,
       html = el.innerHTML;

     el.innerHTML = html + r[0];
   }
 }

 const renderNugget = (instance, data) => {
   if (!instance.stylesheetInitiated) {
     nuggetCounter++;
     instance.counter = nuggetCounter;
   }

   const counter = instance.counter;
   // Create a variable that holds the template 
   const template = instance.template instanceof Function ? instance.template(data) : instance.template,
     // Parse and initiate Nested Nuggets
     initiated = initiateSubComponents(template, true),
     // Render parsed html
     rendered = renderTemplate(initiated, data);

   const html = g(rendered, counter);

   if (!instance.stylesheetInitiated) {
     // Initiate stylesheet for instance 
     initiateStyleSheet(`.${"nugget"+counter}`, instance, true);
     instance.stylesheetInitiated = true;
   }
   // Return processed html
   return html;
 }

 class Nugget {
   /**
    * A class for creating reusable UI components
    * @param {Object} options    An object containing all required options for the component
    */

   constructor(name, options = {}) {
     if (name) {
       globalThis[name] = this;
     }
     // Stores instanc's stylesheet 
     this.stylesheet = options.stylesheet ?? {};

     // Create a property that generates a unique className for instance's parent element
     this.className = `qfEl${counterQF}`;
     // Increment the counterQF variable for later use
     counterQF++;
     // Stores template 
     this.template = options.template;
     this.stylesheetInitiated = false;
     this.counter = 0;
   }
 }

 export {
   QComponent,
   subComponent,
   Nugget,
   Template
 };