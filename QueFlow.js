/*! QueFlowJS | (c) 2024 Dayson9 | MIT License | https://github.com/dayson9/queflowjs */

const QueFlow = ((exports) => {
  'use-strict';
  // Stores data for all elements that are not in components.
  var dataQF = [],
    // Counter for generating unique IDs for elements with reactive data.
    counterQF = 0,

    stylesheet = {
      el: document.createElement("style"),
      isAppended: false
    };

  _this = {};

  // Selects an element in the DOM using its data-qfid attribute.
  function selectElement(qfid) {
    return document.querySelector("[data-qfid=" + qfid + "]");
  }

  // Counts the number of placeholders ({{...}}) in a given template string.
  function countPlaceholders(temp) {
    if (!temp) {
      temp = "";
    }

    // Regex to match opening and closing placeholders.
    let reg = /{{/g;
    let reg1 = /}}/g;

    // Counts occurrences of both opening and closing placeholders.
    let x = temp.match(reg) == null ? 0 : temp.match(reg).length;
    let x1 = temp.match(reg1) == null ? 0 : temp.match(reg1).length;

    // Returns the larger count, ensuring that matching pairs are considered.
    return x > x1 ? x : x1;
  }

  // Checks if a string is not an event handler (e.g., "onclick").
  function isNotEvent(str) {
    // Regex to match strings starting with "on".
    let reg = /^[on]{1}.{1,}$/;
    // Returns true if the string does not match the regex, indicating it's not an event handler.
    return !reg.test(str);
  }

  // Determines if a template needs to be updated based on a given key.
  function shouldUpdate(temp, key, len) {
    let objName, decision = false;

    if (!temp) {
      temp = "";
    }

    // Checks if the template contains the given key.
    decision = temp.includes(key);

    // Evaluates the template with the provided length.
    return [decision, evaluateTemplate(len, temp, true)];
  }

  // Filters out null elements from the given input [Array].
  function filterNullElements(input) {
    let data = input.filter((d) => {
      let el = selectElement(d.qfid);
      // If element exists, return its array (d).
      if (el) {
        return d;
      }
    });

    return data;
  }

  // Updates the DOM based on changes to data in the reactive signals.
  function updateDOM(key) {
    // Cache selectors for efficiency
    let elements = {};
    let eventListeners = {};

    // Filter out null elements before iteration
    dataQF = filterNullElements(dataQF);

    // Iterate over filtered dataQF in a single loop
    for (let i = 0; i < dataQF.length; i++) {
      let pieces = dataQF[i];
      let len = countPlaceholders(pieces.template);

      // Cache elements for reuse
      if (!elements[pieces.qfid]) {
        elements[pieces.qfid] = selectElement(pieces.qfid);
        if (!elements[pieces.qfid]) {
          throw new Error("An error occurred while selecting element for QFID: " + pieces.qfid);
          continue; // Skip to next element if selection failed
        }
      }

      // Reuse cached element
      let el = elements[pieces.qfid];
      let v = shouldUpdate(pieces.template, key, len);

      if (v[0]) {
        style(el, pieces.key, v[1]);
      }
    }
  }

  // Creates a reactive signal, a proxy object that automatically triggers when its values changes.
  function createSignal(data, object) {
    let item = typeof data != "object" ? { value: data } : data;

    let handler = {};

    if (object) {
      let host = object.host;
      handler = {
        get: (target, key) => {
          if (['object', 'array'].indexOf(typeof target[key]) > -1) return createSignal(target[key], host);
          return target[key];
        },

        set: (target, key, value) => {
          key = (parseInt(key)) ? parseInt(key) : key;

          if (!host.isFrozen) {
            if (key > host.data.length - 1) {
              target[key] = value; // Update the target object accordingly
              host.render();
            } else {
              // Update the target object accordingly
              target[key] = value;
              _this = host;
              updateComponent(key, host);
            }
          }
          return true;
        }
      };
    } else {
      handler = {
        get: (target, key) => {
          if (['object', 'array'].indexOf(typeof target[key]) > -1) return createSignal(target[key], host);

          return target[key];
        },

        set: (target, key, value) => {
          target[key] = value;
          updateDOM(key);
          return true;
        }
      };
    }

    return new Proxy(item, handler);
  }

  // Checks if a DOM element has child elements.
  function hasChildren(element) {
    let children = element.querySelectorAll("*") || 0;
    // Returns true if there are children and an array of child elements.
    return children.length > 0 ? [true, children] : [false];
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
  function sanitizeString(str) {
    str = str.toString();
    return str.replace(/javascript:/gi, '').replace(/[^\w-_. ]/gi, function(c) {
      if (c === ">") {
        return "&gt;";
      } else if (c === "<") {
        return "&lt;";
      } else {
        return c;
      }
    });
  }


  // Evaluates a template string by replacing placeholders with their values.
  function evaluateTemplate(len, reff, indicator) {
    let out = reff,
      i = 0,
      extracted = "",
      parsed = "";

    try {
      if (len) {
        // Iterates through all placeholders in the template.
        for (i = 0; i < len; i++) {
          // Extracts the placeholder expression.
          extracted = stringBetween(out, "{{", "}}");

          // Evaluates the placeholder expression.
          parsed = Function('"use-strict"; return ' + extracted)().toString();


          if (!indicator) {
            // Replaces the placeholder with its evaluated value.
            out = out.replace("{{" + extracted + "}}", parsed);
          } else {
            // Replaces the placeholder with its sanitized evaluated value.
            out = out.replace("{{" + extracted + "}}", sanitizeString(parsed));
          }
        }
      } else {
        out = JSON.parse(out);
      }
    } catch (error) {
      let reg = /Unexpected token/i;
      // Prevents some unnecessary errors from being thrown
      if (!reg.test(error))
        console.error("An error occurred while parsing JSX/HTML:\n\n" + error);
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
          value = att.nodeValue;

        arr.push({ attribute: name, value: value });
      }
    } catch (error) {
      throw new Error("An error occurred while getting the attributes of " + el, error);
    }


    // Returns the array of attributes.
    return arr;
  }


  // Converts JSX/HTML string into plain HTML, handling placeholders.
  function jsxToHTML(jsx) {
    let parser = new DOMParser(),
      children = [],
      out = "",
      attributes = [],
      data = [];
    let d = parser.parseFromString(jsx, "text/html"),
      doc = d.body;

    try {
      // Selects all child elements within the doc.
      children = doc.querySelectorAll("*");

      // Iterates through each child element.
      for (let c of children) {
        // Checks if the element has no children.
        if (!hasChildren(c)[0]) {
          data = [...data, ...generateComponentData(c)];
        } else {
          data = [...data, ...generateComponentData(c, true)];
        }
      };

    } catch (error) {
      let reg = /Unexpected token/i;
      // Prevents some unnecessary errors from being thrown
      if (!reg.test(error))
        console.error("An error occurred while processing JSX/HTML:\n\n" + error);
    }

    // Removes the temporary doc element from the DOM.
    doc.remove();

    let len = countPlaceholders(doc.innerHTML);
    out = evaluateTemplate(len, doc.innerHTML, true);

    // Returns the parsed HTML string.
    return [out, data];
  }

  // Renders a JSX/HTML string into the specified selector.
  function Render(jsx, selector, position) {
    let app = typeof selector == "string" ? document.querySelector(selector) : selector,
      prep = "";
    // Checks if the selector is valid.
    if (app) {
      let result = jsxToHTML(jsx);

      // Re-renders the element's content.
      prep = result[0];
      dataQF = [...dataQF, ...result[1]];

      // Appends the HTML to the target element.
      if (position == "append") {
        app.innerHTML += prep;
      } else if (position == "prepend") {
        // Prepends the HTML to the target element.
        let html = app.innerHTML;
        app.innerHTML = prep + html;
      } else {
        app.innerHTML = prep;
      }
    } else {
      // Logs an error if the selector is invalid.
      throw new Error("An element with the provided selector: '" + selector + "' does not exist");
    }
  }

  // Re-renders the content of a specified element, updating its reactive components.
  function iRender(selector) {
    let app = typeof selector == "string" ? document.querySelector(selector) : selector;
    // Checks if the selector is valid.
    if (app) {
      // Checks if the element has children.
      if (hasChildren(app)[0]) {
        let result = jsxToHTML(app.innerHTML);
        // Re-renders the element's content.
        app.innerHTML = result[0];
        dataQF = [...dataQF, ...result[1]];

      }
    } else {
      // Logs an error if the selector is invalid.
      throw new Error("An element with the provided selector: '" + selector + "' does not exist");
    }
  }




  //Compares two objects and checks if their key-value pairs are strictly same
  function isSame(obj1, obj2) {
    let key1 = Object.keys(obj1),
      key2 = Object.keys(obj2),
      result = false;

    // If their lengths isn't the same, the objects are different
    if (key1.length != key1.length) {
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

  // Generates and returns dataQF property based on 'child' parameter
  function generateComponentData(child, isParent) {
    let arr = [],
      attr = getAttributes(child),
      id = child.dataset.qfid;

    if (!isParent) {
      // Pushes innertext attribute into 'attr'
      attr.push({ attribute: "innerHTML", value: child.innerText });
    }
    for (let { attribute, value } of attr) {

      let hasTemplate = (value.includes("{{") && value.includes("}}"));
      let len = countPlaceholders(value);

      if (!id && hasTemplate) {
        child.dataset.qfid = "qf" + counterQF;
        id = "qf" + counterQF;
        counterQF++;
      }

      if (child.style[attribute] || child.style[attribute] === "") {
        child.style[attribute] = evaluateTemplate(len, value);

        if ((attribute.toLowerCase()) !== "src") {
          child.removeAttribute(attribute);
        }
      }


      if (hasTemplate) {
        (child.style[attribute] || child.style[attribute] === "") ? arr.push({ template: value, key: "style." + attribute, qfid: id })  :  arr.push({ template: value, key: attribute, qfid: id });
      }


    }

    // Returns arr 
    return arr;
  }


  function objToStyle(selector = "", obj = {}) {
    let keys = Object.keys(obj), style ='', len = keys.length;
    
    for (let i = 0; i < len; i++) {
      style+= "\n"+selector+" "+keys[i]+" {"+obj[keys[i]]+"}\n";
    }
    
    return style;
  }

  function initiateComponentStyle(selector = "", instance = Object) {
    let styles = objToStyle(selector, instance.stylesheet);
   
    (stylesheet.el).textContent+= styles;
    
    if (!stylesheet.isAppended) {
      document.head.appendChild(stylesheet.el);
    }
  }

  /**
   * Defines a QComponent class 'for creating and managing components.
   * @param {String|Node} element    The element to mount component into
   * @param {Object} options      Options i.e "data", "template"
   * @return null
   */
  class QComponent {
    constructor(selector = "", options = {}) {
      // Assigns the current instance to _this.
      _this = this;
      // Stores the element associated with a component
      this.element = typeof selector == "string" ? document.querySelector(selector) : selector;

      if (!this.element) throw new Error("Element selector for component is invalid " + selector);

      // Creates a reactive signal for the component's data.
      this.data = createSignal(options.data, { forComponent: true, host: this });

      // Asigns the value of '_this.data' to _data
      let _data = this.data;

      // Stores the options provided to the component.
      this.options = options;

      // Stores the current 'freeze status' of the component
      this.isFrozen = false;


      // Stores the component's stylesheet 
      this.stylesheet = options.stylesheet;
      
      // Stores the component's reactive elements data
      this.dataQF = [];
      
      if(!this.element.id) throw new Error("To use component scoped stylesheets, component's element must have a valid id")
      // Initiates a component's stylesheet 
      initiateComponentStyle(selector, this);
      
      // Defines properties for the component instance.
      Object.defineProperties(this, {
        template: { value: this.options.template },
        data: {
          // Getters and setters for 'data' property 
          get: () => {
            return _data;
          },
          set: (data) => {
            // If 'data' is not same as '_this.data' and component is not frozem
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

    }

    render() {
      _this = this;
      let el = this.element;
      // Checks if the component's template is a string or a function.
      let template = this.template instanceof Function ? this.template() : this.template;


      let rendered = jsxToHTML(template);

      el.innerHTML = rendered[0];
      this.dataQF = rendered[1];
    }

    freeze() {
      // Freezes component
      this.isFrozen = true;
    }

    unfreeze() {
      // Unfreezes component
      this.isFrozen = false;
    }

  }


  function style(child, key, evaluated) {
    if (key.indexOf("style.") > -1) {
      let sliced = key.slice(6);
      if (evaluated !== child.style[sliced]) {
        child.style[sliced] = evaluated;
      }
    } else {
      if (evaluated !== child[key]) {
        if (isNotEvent(key)) {
          child[key] = evaluated;
        } else {
          child.addEventListener(key.slice(2), evaluated);
        }
      }
    }
  }


  // Updates a component based on changes made to it's data
  function updateComponent(ckey, obj) {
    // Filters Null elements from the Component

    obj.dataQF = filterNullElements(obj.dataQF);

    let { dataQF } = obj;

    for (let d of dataQF) {
      let { template, key, qfid } = d;
      let child = selectElement(qfid);
      if (template.includes(ckey)) {
        let len = countPlaceholders(template);

        evaluated = (key.includes("style.")) ? evaluateTemplate(len, template) : evaluateTemplate(len, template, true);
        
        key = (key === "class") ? "className" : key;
        style(child, key, evaluated);
      }
    }

  }

  function renderTemplate(input, props) {
    let len = countPlaceholders(input),
      i = 0;

    for (i; i < len; i++) {
      let extracted = stringBetween(input, "{{", "}}");
      input = input.replaceAll("{{" + extracted + "}}", sanitizeString(props[extracted]));
    }

    return input;
  }

  /** Creates a class for managing reusable templates
   * 
   * @param {String|Node} element    The element to mount template into
   * @param {String|Function} templateFunc    A function that returns string to make into a template
   */
  class Template {
    constructor(el, templateFunc) {
      this.element = el;
      this.template = templateFunc;
    }

    renderWith(data, position = "append") {
      let template = (this.template instanceof Function) ? this.template(data) : this.template;

      let rendered = renderTemplate(template, data),
        r = jsxToHTML(rendered),
        el = document.querySelector(this.element),
        html = el.innerHTML;

      el.innerHTML = html + r[0];
    }
  }

  // Exports the public APIs of QueFlowJS.
  exports.Render = Render;
  exports.createSignal = createSignal;
  exports.iRender = iRender;
  exports.QComponent = QComponent;
  exports.Template = Template;

  // Define the exports as an ES Module
  Object.defineProperty(exports, "__esModule", { value: true });

  return exports;

})({});