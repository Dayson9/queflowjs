/*! QueFlowJS | (c) 2024 Dayson9 | MIT License | https://github.com/Dayson9/QueFlowJS */

const QueFlow = ((exports) => {
  // Stores data for all registered components and their associated template placeholders.
  var dataQF = [],
    // Counter for generating unique IDs for elements with reactive data.
    counterQF = 0,
    // Placeholder for future component storage.
    components = {};

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

  // Checks if a string is not an event handler (e.g., "onClick").
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
    return [decision, evaluateTemplate(len, temp)];
  }

  // Filters out components from dataQF that are no longer associated with existing elements in the DOM.
  function filterNullElements() {
    dataQF = dataQF.filter((data) => {
      let el = selectElement(data.qfid);
      // Only keeps components that have a corresponding DOM element.
      if (el) {
        return data;
      }
    });
  }

  // Updates the DOM based on changes to data in the reactive signals.
  function updateDOM(key) {
    // Cache selectors for efficiency
    let elements = {};
    let eventListeners = {};
  
    // Filter out null elements before iteration
    filterNullElements();
    
    // Iterate over filtered dataQF in a single loop
    for (let i = 0; i < dataQF.length; i++) {
      let pieces = dataQF[i];
      let len = countPlaceholders(pieces.template);
  
      // Cache elements for reuse
      if (!elements[pieces.qfid]) {
        elements[pieces.qfid] = selectElement(pieces.qfid);
        if (!elements[pieces.qfid]) {
          throw new Error("An error occurred while selecting element for QFID:", pieces.qfid);
          continue; // Skip to next element if selection failed
        }
      }
  
      // Reuse cached element
      let el = elements[pieces.qfid];
      let v = shouldUpdate(pieces.template, key, len);
  
      if (v[0]) {
        if (isNotEvent(pieces.key)) {
      (pieces.key === "class") ? el.className = v[1] : el[pieces.key] = v[1];
        } else {
          // Cache event listeners for reuse
          if (!eventListeners[pieces.qfid + pieces.key]) {
            eventListeners[pieces.qfid + pieces.key] = v[1];
            el.addEventListener(pieces.key.slice(2), eventListeners[pieces.qfid + pieces.key]);
          }
        }
      }
    }
  }

  // Creates a reactive signal, a proxy object that automatically updates the DOM/Component when its values change.
  function createSignal(data, object) {
  let item = typeof data != "object" ? { value: data } : JSON.parse(JSON.stringify(data));

  function createReactiveObject(obj) {
    if (typeof obj !== "object") return obj;

    return new Proxy(obj, {
      get(target, key) {
        return createReactiveObject(target[key]); // Make nested objects reactive
      },
      set(target, key, value) {
        if (target[key] === value) return true;

        target[key] = value; // Update the target object accordingly

        if (object.forComponent) {
          updateComponent(key, object.self);
        } else {
          updateDOM(key);
        }
        return true; 
      },
    });
  }

  const proxy = createReactiveObject(item);
  return proxy;
}

  // Checks if a DOM element has child elements.
  function hasChildren(element) {
    let children = element.querySelectorAll("*") || 0;
    // Returns true if there are children and an array of child elements.
    return children.length > 0 ? [true, children] : [false];
  }

  // Creates a new DOM element with the specified tag name, attributes, and inner HTML.
  function createElement(tagName, attribs = [], children) {
    let el = document.createElement(tagName),
      len = attribs.length,
      i = 0;
    // Sets attributes on the element.
    for (i = 0; i < len; i++) {
      let attrib = attribs[i].attribute;
      let value = attribs[i].value;
      el.setAttribute(attrib, value);
    }

    // Sets the inner HTML of the element.
    el.innerHTML = children;

    // Returns the created DOM element.
    return el;
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
    return str
      .replace(/javascript:/gi, "")
      .replace(/[^\w-_. ]/gi, function (c) {
        if (c === "{") {
          return "{";
        } else if (c === "}") {
          return "}";
        } else {
          return "&#" + c.charCodeAt(0) + ";";
        }
      });
  }
  
  
  // Evaluates a template string by replacing placeholders with their values.
  function evaluateTemplate(len, reff) {
    let out = reff,
      i = 0,
      extracted = "",
      parsed = "";
    try {
      // Iterates through all placeholders in the template.
      for (i = 0; i < len; i++) {
        // Extracts the placeholder expression.
        extracted = stringBetween(out, "{{", "}}");
        // Evaluates the placeholder expression.
        parsed = Function('"use-strict"; return ' + extracted)();
        
        // Replaces the placeholder with its evaluated value.
        out = out.replace("{{" + extracted + "}}", parsed);
      }
    } catch (error) {
      throw new Error("An error occurred while parsing JSX/HTML", error);
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
        arr.push({ attribute: att.nodeName, value: att.nodeValue });
      }
    } catch (error) {
      throw new Error("An error occurred while getting the attributes of " + el, error);
    }
    // Returns the array of attributes.
    return arr;
  }

  // Parses a JSX/HTML string and registers components for reactive updates.
  function parseQF(arg = [], ref = "", id = "") {
    let component = [],
      parsed,
      len,
      cpy,
      index = 0;
    // Counts the number of placeholders in the reference string.
    len = countPlaceholders(ref);
    // Iterates through the arguments.
    arg.forEach((arr) => {
      // Checks if the attribute value contains placeholders.
      if (arr.value.includes("{{") && arr.value.includes("}}")) {
        // Adds the component data to the array.
        component[index] = { template: arr.value, key: arr.attribute, qfid: id };
        index++;
      }
    });

    // Creates a copy of the existing dataQF.
    cpy = dataQF;
    // Concatenates the new component data with the existing data.
    dataQF = [...cpy, ...component];


    // Evaluates the template string with the provided length.
    parsed = evaluateTemplate(len, ref);
    
    return parsed;
  }

  // Converts JSX/HTML string into plain HTML, handling placeholders.
  function jsxToHTML(jsx, isComponent) {
    let div = document.createElement("div"),
      children = [],
      out = "",
      attributes = [],
      data = [];
    
    // Sanitizes the JSX/HTML string.
    div.innerHTML = sanitizeString(jsx);
    // Extracts the text content of the sanitized string.
    div.innerHTML = div.textContent;
    
    try {
      // Selects all child elements within the div.
      children = div.querySelectorAll("*");
      // Iterates through each child element.
      children.forEach((c) => {
        // Checks if the element has no children.
        if (!hasChildren(c)[0]) {
          // Gets the attributes of the element.
          attributes = getAttributes(c);
          attributes.push({ attribute: "innerText", value: c.innerText });
         
          
          // Iterates through each attribute.
          for (let attribute of attributes) {
            let val = attribute.value;
            // Checks if the attribute value contains placeholders.
            if (val.includes("{{") && val.includes("}}")) {
              // Assigns a unique ID to the element if the attribute contains templates.
              c.dataset.qfid = "qf" + counterQF;
              // Increments the counter for the next element.
              counterQF++;
              // Breaks the loop after finding a placeholder.
              break;
            }
          }
          
          if (isComponent) {
           data = [...data, ...generateComponentData(c)];
          }
          
          
          // Parses the element's attributes and registers it for reactive updates.
          out = parseQF(attributes, div.innerHTML, c.dataset.qfid);
        }
      });
    } catch (error) {
      throw new Error("An error occurred while processing JSX/HTML", error);
    }
    // Removes the temporary div element from the DOM.
    div.remove();

    // Returns the parsed HTML string.
    return [out, data];
  }

  // Renders a JSX/HTML string into the specified selector.
  function Render(jsx, selector, position) {
    let app = typeof selector == "string" ? document.querySelector(selector) : selector;
    // Checks if the selector is valid.
    if (app) {
      // Converts the JSX/HTML string into plain HTML
      let prep = jsxToHTML(jsx)[0];

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
      throw new Error("An element with the provided selector: ", selector, "does not exist");
    }
  }

  // Re-renders the content of a specified element, updating its reactive components.
  function iRender(selector) {
    let app = typeof selector == "string" ? document.querySelector(selector) : selector;
    // Checks if the selector is valid.
    if (app) {
      // Checks if the element has children.
      if (hasChildren(app)[0]) {
        // Re-renders the element's content.
        app.innerHTML = jsxToHTML(app.innerHTML)[0];
      }
    } else {
      // Logs an error if the selector is invalid.
      throw new Error("An element with the provided selector: ", selector, "does not exist");
    }
  }
  
  
  

//Compares two objects and checks if their key-value pairs are strictly same
function isSame(obj1, obj2) {
  let key1 = Object.keys(obj1), key2 = Object.keys(obj2), result = false;
 
 if(key1.length != key1.length) {
   result = false;
 } else {
   for (key of key1) {
     if((obj1[key] === obj2[key])) {
       result = true;
     } else {
       result = false;
       break;
     }
   }
 }

  return result;
}

function generateComponentData(child) {
  let arr = [], attr = getAttributes(child), id = child.dataset.qfid;
  
  attr.push({attribute: "innerText", value: child.innerText});
  
  attr.forEach((a) =>{
    if (a.value.includes("{{") && a.value.includes("}}")) {
      arr.push({ template: a.value, key: a.attribute, qfid: id });
    }
  });
  
  return arr;
  
}

  // Defines a QComponent class for creating and managing components.
  function QComponent(selector, options = {}) {
    
  // Assigns the current instance to _this.
  _this = this;

// Stores the element associated with a component
_this.element = typeof selector == "string" ? document.querySelector(selector) : selector;

if(!_this.element) {
  throw new Error("Element selector for component is invalid ",  selector)
}
 
  // Creates a reactive signal for the component's data.
  _this.data = createSignal(options.data, {forComponent: true, self: _this});


_data = _this.data;

  // Stores the options provided to the component.
  _this.options = options;

_this.dataQF = [];

  // Defines properties for the component instance.
  Object.defineProperties(_this, {
    template: { value: options.template },
    data: {
      get: () => {
        return _data;
      },
      set: (data) => {
        if (!isSame(data, this.data)) {
        _data = createSignal(data, {forComponent: true, self: _this});
        filterNullElements();
        _this.render();
        }
        return true;
      },  
    }
    });
    
    

}

  // Renders the component's template into its associated DOM element
  QComponent.prototype.render = function () {
    let el = _this.element;
    
    // Checks if the component's template is a string or a function.
    let template = _this.template instanceof Function ? _this.template() : _this.template;
    
    // Renders template into the element.
    let rendered = jsxToHTML(template, true);
    
    el.innerHTML = rendered[0];
    _this.dataQF = rendered[1];
   
  }

// Updates a component based on changes made to it's data

function updateComponent(ckey, obj) {
  filterNullElements();
  let { dataQF } = obj, currentTemplate;

for (let d of dataQF) {
    let { template, key, qfid } = d;
    let child = selectElement(qfid);
    if(template.includes(ckey)){
      let len = countPlaceholders(template), evaluated = evaluateTemplate(len, template);
      key = key === "class" ? "className" : key;
     if(evaluated !== child[key]){
     
        if (isNotEvent(key)) {
          (key === "class") ? child.className = evaluated : child[key] = evaluated;
          
        } else {
          child.addEventListener(key.slice(2), evaluated);
        }
      }
    }     
    
  }
 
}


  // Exports the public APIs of QueFlowJS.
  exports.Render = Render;
  exports.createSignal = createSignal;
  exports.iRender = iRender;
  exports.QComponent = QComponent;

  // Define the exports as an ES Module
  Object.defineProperty(exports, "__esModule", { value: true });
  return exports;

})({});
