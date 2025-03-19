/*!
 * QueFlow.js
 * (c) 2024-now Sodiq Tunde (Dayson9)
 * Released under the MIT License.
 */
'use-strict';

// Counter for generating unique IDs for elements with reactive data.
var counterQF = -1,
  nuggetCounter = -1,
  routerObj = {},
  currentComponent,
  navigateFunc = (() => {}),
  globalStateDataQF = [];

var stylesheet = {
  el: document.createElement("style"),
  isAppended: false
};

const components = new Map(),
  nuggets = new Map();

// Selects an element in the DOM using its data-qfid attribute.
const selectElement = qfid => document.querySelector("[data-qfid=" + qfid + "]");


const strToEl = (component) => {
  const id = component.element;
  if (typeof id === "string") {
    component.element = document.getElementById(id);
  }
}

// Filters out null elements from the given input [Array].
function filterNullElements(input) {
  return input.filter((d) => selectElement(d.qfid) ? d : null);
}

const globalState = (name, val, shouldStore) => {
  let stored;
  if (shouldStore) {
    stored = localStorage.getItem(name);
    val = stored ? JSON.parse(stored) : val;
  }
  const obj = typeof val === "object" ? val : { value: val };
  const reactiveObj = (object) => {
    return new Proxy(object, {
      get(target, key) {
        return target[key];
      },
      set(target, key, value) {
        if (target[key] !== value) {
          target[key] = value;
          updateComponent(key, true, value);
          if (shouldStore) localStorage.setItem(name, JSON.stringify(target));
        }
      }
    })
  }
  globalThis[name] = reactiveObj(obj);
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
        if (prev !== value) {
          target[key] = value;
          requestAnimationFrame(() => {
            const host = object;
            if (!host.isFrozen) {
              const goAhead = host.onUpdate ? host.onUpdate({
                oldVal: prev,
                key: key,
                newVal: value
              }, host.data) : true;
              if (goAhead) updateComponent(key, host, value);
              return true;
            }
          });
        }
        return true;
      },
    });
  }

  return createReactiveObject(item);
}

const b = str => stringBetween(str, "{{", "}}");

// Checks if a DOM element has child elements.
const hasChildren = (element) => element.children.length;

// Extracts the string between two delimiters in a given string.
function stringBetween(str, f, s) {
  const indx1 = str.indexOf(f),
    indx2 = str.indexOf(s);

  return str.slice(indx1 + f.length, indx2);
}

// Sanitizes a string to prevent potential XSS attacks.
function sanitizeString(str) {
  const excluded_chars = [{ from: "<", to: "&lt;" }, { from: ">", to: "&gt;" }];

  str = new String(str);

  for (const index in excluded_chars) {
    const { from, to } = excluded_chars[index];
    str = str.replaceAll(from, to);
  }

  return str.replace(/javascript:/gi, '');
}


const EVAL_REGEX = /\{\{[^\{\{]+\}\}/g;
const ENTITY_REGEX = /&(gt|lt);/g;
const FALSY = [undefined, NaN, null];

function evaluateTemplate(reff, instance) {
  let out = "",
    currentMarkup = "";

  try {
    out = reff.replace(EVAL_REGEX, (match) => {
      currentMarkup = match;
      // Combined HTML entity replacement in single pass
      const processedMatch = match.replace(ENTITY_REGEX, (_, entity) =>
        entity === 'gt' ? '>' : '<'
      );
      let ext = b(processedMatch).trim();
      const shouldNegate = ext.startsWith('!');
      const isGlobal = ext.startsWith('$');
      const prefix = ext.startsWith('this') ? '' : 'this.data.';
      let rendered;

      if (!isGlobal) {
        ext = shouldNegate ?
          `!${prefix}${ext.slice(1)}` :
          `${prefix}${ext}`;

        let parsed = Function(`return ${ext}`).call(instance);
        if (FALSY.includes(parsed) && parsed != "0") {
          parsed = Function(`return ${ext}`).call(instance);
        }

        rendered = FALSY.includes(parsed) && parsed != "0" ?
          match :
          parsed;
      } else {
        rendered = Function(`return ${ext}`)();
      }
      return rendered;
    });
  } catch (error) {
    console.error(`QueFlow Error:\nAn error occured from expression \`${currentMarkup}\``);
  }

  return out;
}


// Gets the attributes of a DOM element.
function getAttributes(el) {
  return Array.from(el.attributes).map(({ nodeName, nodeValue }) => ({ attribute: nodeName, value: nodeValue }));
}


// Converts JSX/HTML string into plain HTML and Component data, handling placeholders.
function jsxToHTML(jsx, instance, subId, flag) {
  const div = document.createElement("div");
  div.innerHTML = jsx;
  const data = [];

  try {
    const targetElements = div.querySelectorAll("*");

    for (const element of targetElements) {
      if (subId && !element.hasAttribute("data-sub_id")) {
        element.dataset.sub_id = subId;
      }

      data.push(...generateComponentData(element, hasChildren(element), instance));
      element.removeAttribute("innertext");
    }
  } catch (error) {
    console.error(`QueFlow Error:\nAn error in Component \`${instance.name || ""}\`:\n ${error}\n\nError sourced from: \`${jsx}\``);
  }

  const out = !flag ? evaluateTemplate(div.innerHTML, instance) : div.innerHTML;

  div.remove();
  return [out.replaceAll("<br>", "\n"), data];
}


//Compares two objects and checks if their key-value pairs are strictly same
function isSame(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

function convertDirective(attr, value, child) {
  const btw = b(value);
  switch (attr) {
    case 'q:show':
      child.removeAttribute(attr);
      return ['display', btw ? `{{ ${btw} ? 'block' : 'none' }}` : btw];
      break;

    default:
      return [attr, value];
  }
}

// Generates and returns dataQF property
const generateComponentData = (child, isParent, instance) => {
  const arr = [];
  const attributes = getAttributes(child);
  let componentId = child.dataset.qfid;
  const { useStrict } = instance;

  // Precompute content injection for non-parents
  if (!isParent) {
    const contentKey = useStrict ? 'innerText' : 'innerHTML';
    const contentValue = useStrict ? child[contentKey] : child.innerHTML;
    attributes.push({ attribute: contentKey, value: contentValue });
  }

  // Cache expensive operations
  const processAttribute = ({ attribute, value }) => {
    value = value || '';
        [attribute, value] = convertDirective(attribute, value, child);

    const hasTemplate = value.includes('{{') && value.includes('}}');
    const processedValue = b(value).trim();
    const isGlobal = processedValue.startsWith('$');
    const evaluation = evaluateTemplate(value, instance);

    // Generate component ID once per element
    if (!componentId && hasTemplate) {
      child.dataset.qfid = `qf${counterQF}`;
      componentId = `qf${counterQF}`;
      counterQF++;
    }

    // DOM manipulation optimization
    const style = child.style;
    const styleProp = style[attribute];
    const isValidStyleProp = styleProp !== undefined;
    const requiresStyleKey = (
      (isValidStyleProp && attribute.toLowerCase() !== 'src') ||
      attribute === 'filter'
    );

    // Single DOM write path
    if (isValidStyleProp || styleProp === '') {
      style[attribute] = evaluation;
      if (attribute.toLowerCase() !== 'src') {
        child.removeAttribute(attribute);
      }
    } else {
      if (child.getAttribute(attribute)) {
        child.setAttribute(attribute, evaluation);
      } else {
        child[attribute] = evaluation;
      }
    }

    // Template tracking optimization
    if (hasTemplate && evaluation !== value) {
      return {
        template: value,
        key: requiresStyleKey ? `style.${attribute}` : attribute,
        qfid: componentId,
        isGlobal: isGlobal
      };
    }
    return null;
  };

  // Batch process attributes
  for (const entry of attributes) {
    const result = processAttribute(entry);
    if (result) {
      result.isGlobal ?
        globalStateDataQF.push(result) :
        arr.push(result);
    }
  }

  return arr;
};


// Function to convert an object into a CSS string
function objToStyle(selector = "", obj = {}, alt = "", shouldSwitch) {
  let style = "";
  const isRegularRule = !alt.includes("@keyframes") && !alt.includes("@font-face");

  for (const key in obj) {
    const value = obj[key];
    const isFontFace = key.includes("@font-face");

    if (typeof value === "string") {
      const isMedia = alt.includes("@media");
      const sel = typeof value === "string" || isMedia ? selector : "";

      if (!shouldSwitch) {
        style += `\n${isRegularRule && !isFontFace ? sel : ""} ${key} {${value}}\n`;
      } else {
        style += `\n${key}${isRegularRule && !isMedia ? sel : ""} {\n${value}}\n`;
      }
    } else {
      style += `\n${key} {\n${objToStyle(selector, value, key)}\n}`;
    }
  }

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
  const children = parent.querySelectorAll("*");

  for (const child of children) {
    const subId = child.dataset.sub_id;
    const targetInstance = subId ? components.get(subId) : instance;

    if (targetInstance) {
      const attributes = getAttributes(child);

      for (const { attribute, value } of attributes) {
        if (attribute.startsWith("on")) {
          try {
            child[attribute] = Function("e", `const data = this.data; ${value}`).bind(targetInstance);

          } catch (e) {
            console.error(`QueFlow Error:\nFailed to add event listener on ${child.tagName} element:\n\nError from: \`${value}\``);
          }
        }
      }
    }
    child.removeAttribute("data-sub_id");
  }
}

function update(child, key, evaluated) {
  switch (key) {
    case 'q:exist':
      if (evaluated == "false") {
        removeEvents([child, ...child.querySelectorAll("*")]);
        child.remove();
      }
      break;
    default:
      if (key.indexOf("style.") > -1) {
        let sliced = key.slice(6);
        child.style[sliced] = evaluated;
      } else {
        if (!child?.getAttribute(key)) {
          if (child[key] != evaluated) child[key] = evaluated;
        } else {
          if (child.getAttribute(key) != evaluated) child.setAttribute(key, evaluated);
        }
      }
  }
}


// Checks if a template placeholder contains a key
function needsUpdate(template, key) {
  if (!template.includes("{{") || !template.includes("}}")) return false;

  return (b(template).includes(key)) ? true : needsUpdate(template.replace("{{" + b(template) + "}}", b(template)), key);
}

// Updates a component based on changes made to it's data
function updateComponent(ckey, obj, _new) {
  let dataQF;
  if (typeof obj === "boolean") {
    globalStateDataQF = filterNullElements(globalStateDataQF);
    dataQF = globalStateDataQF;
  } else {
    obj.dataQF = filterNullElements(obj.dataQF);
    dataQF = obj.dataQF;
  }

  for (let d of dataQF) {
    let { template, key, qfid } = d;
    const child = selectElement(qfid);
    if (child) {
      if (needsUpdate(template, ckey)) {
        let evaluated = evaluateTemplate(template, obj);
        key = (key === "class") ? "className" : key;
        update(child, key, evaluated);
      }
    }
  }
}

function renderTemplate(input, props, shouldSanitize) {
  const regex = /\{\{([^\{\}]+)\}\}/g; // Improved regex

  return input.replace(regex, (_, extracted) => { // Capture and use extracted
    const trimmed = extracted.trim();
    const value = props[trimmed];

    if (value === undefined || value === null) {
      return `{{ ${trimmed} }}`;
    }

    return shouldSanitize ? sanitizeString(value) : value;
  });
}

function initiateNuggets(markup, isNugget) {
  const nuggetRegex = /<([A-Z]\w*)\s*\{([\s\S]*?)\}\s*\/>/g;

  if (nuggetRegex.test(markup)) {
    markup = markup.replace(nuggetRegex, (match) => {
      const whiteSpaceIndex = match.indexOf(" "),
        name = match.slice(1, whiteSpaceIndex),
        data = match.slice(whiteSpaceIndex, -2).trim();
      let evaluated;
      try {
        const d = Function(`return ${data}`)(),
          instance = nuggets.get(name);
        if (instance) {
          evaluated = renderNugget(instance, d);
        } else {
          console.error(`QueFlow Error:\nNugget '${name}' is not defined, check whether '${name}' is correctly spelt or is defined.`);
        }
      } catch (e) {
        console.error(`QueFlow Error:\nAn error occured while rendering Nugget '${name}' \n ${e}, \n\nError sourced from: \n\`${match}\``);
      }
      return evaluated;
    });
  }

  return lintPlaceholders(markup, isNugget);
}

const initiateExtendedNuggets = (markup) => {
  const componentRegex = /<(\/?[A-Z]\w*)(\s*\(\{[\s\S]*?}\))?\s*>/g;

  // First pass: Convert component tags to HTML custom elements
  const convertedMarkup = markup.replace(componentRegex, (match, p1, p2) => {
    const isClosing = match.startsWith('</');
    const tagName = p1.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');

    if (isClosing) {
      return `</${tagName.slice(2)}>`;
    }

    const attrs = (p2 || '')
      .replace(/\(\{/g, '{')
      .replace(/\}\)/g, '}')
      .replace(/"/g, '`');

    return `<${tagName} qf-attrs="${attrs}">`;
  });

  let finalMarkup = convertedMarkup;
  // Create temporary DOM
  const process = () => {
    const div = document.createElement("div");
    div.innerHTML = finalMarkup;

    // Process elements in reverse order (deepest first)
    const allElements = div.getElementsByTagName('*');
    const elements = Array.from(allElements).reverse();

    finalMarkup = div.innerHTML;

    for (const element of elements) {
      if (element.hasAttribute('qf-attrs')) {
        const originalTag = element.tagName.toLowerCase()
          .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
          .replace(/^./, m => m.toUpperCase());
        try {
          const attrs = element.getAttribute('qf-attrs');
          const content = element.innerHTML;
          const originalHTML = element.outerHTML;

          const data = new Function(`return ${attrs}`)();
          const instance = nuggets.get(originalTag);
          if (instance) {
            const replacement = renderNugget(instance, data, true, content);
            finalMarkup = finalMarkup.split(originalHTML).join(replacement);
          } else {
            console.error(`QueFlow Error:\nNugget '${originalTag}' is not defined, check whether '${originalTag}' is correctly spelt or is defined.`);
          }

        } catch (e) {
          console.error(`QueFlow Error rendering ${originalTag}:\n${e}\nIn element:\n${originalHTML}`);
        }
      }
    }
  }

  process();
  process();
  return initiateNuggets(finalMarkup);
};

function initiateComponents(markup, isNugget) {
  const subRegex = new RegExp("<[A-Z]\\w+\/[>]", "g");
  markup = lintPlaceholders(markup, isNugget);
  if (subRegex.test(markup) && !isNugget) {
    markup = markup.replace(subRegex, (match) => {
      let evaluated, subName;
      try {
        subName = match.slice(1, -2);
        const instance = components.get(subName);
        if (instance) {
          evaluated = renderComponent(instance, subName);
        } else {
          console.error(`QueFlow Error:\nComponent '${subName}' is not defined, check whether '${subName}' is correctly spelt or is defined.`);
        }

      } catch (e) {
        console.error(`QueFlow Error:\nAn error occured while rendering Component '${subName}' \n ${e}, \n\nError sourced from: \n\`${match}\``);
      }
      return evaluated;
    });
  }

  markup = initiateNuggets(markup);
  markup = initiateExtendedNuggets(markup);

  return lintPlaceholders(markup, isNugget);
}


function g(str, className) {
  const div = document.createElement("div");
  div.innerHTML = str;

  div.querySelectorAll("*").forEach(child => {
    child.classList.add(className);
  });

  return div.innerHTML;
}

const lintPlaceholders = (html, isNugget) => {
  const attributeRegex = /\w+\s*=\s*\{\{[^}]+\}\}/g; // Simplified regex
  const eventRegex = /on\w+\s*=\s*\{\{(.*?)\}\}/gs;

  if (eventRegex.test(html) && !isNugget) {
    html = html.replace(eventRegex, (match) => {
      return match.replaceAll("'", "`").replace("{{", "'").replace(/}}$/, "'");
    });
  }

  if (attributeRegex.test(html)) {
    return html.replace(attributeRegex, (match) => {
      return match.replace("{{", '"{{').replace(/}}$/, '}}"');
    });
  }
  return html;
};

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

const renderComponent = (instance, name, flag) => {
  if (!instance.isMounted) {
    const id = typeof instance.element === 'string' ? instance.element : instance.element.id;

    let template = !flag ? `<div id="${id}"> ${(instance.template instanceof Function ? instance.template(instance.data) : instance.template)} </div>` : (instance.template instanceof Function ? instance.template(instance.data) : instance.template);
    template = handleRouter(template);
    template = initiateComponents(template);

    var rendered;
    if (!flag) {
      rendered = jsxToHTML(template, instance, name);
      // Initiates sub-component's stylesheet 
      initiateStyleSheet(`#${id}`, instance);
    } else {
      initiateStyleSheet(`#${id}`, instance);
      rendered = jsxToHTML(template, instance, name);
    }

    instance.dataQF = rendered[1];
    instance.isMounted = true;
    return rendered[0];
  } else {
    return ""
  }
}

class App {
  constructor(selector = "", options = {}) {
    // Stores the element associated with a component
    this.element = typeof selector == "string" ? document.querySelector(selector) : selector;

    if (!this.element) throw new Error("QueFlow Error:\nElement selector '" + selector + "' is invalid");
    this.upTime = 0;
    // Creates a reactive signal for the component's data.
    this.data = createSignal(options.data, this);

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

    this.onUpdate = options.onUpdate;

    this.created = options.created;
    this.run = options.run || (() => {});

    this.useStrict = Object.keys(options).includes('useStrict') ? options.useStrict : true;

    let id = this.element.id;
    if (!id) throw new Error("QueFlow Error:\nTo use component scoped stylesheets, component's mount node must have a valid id");

    // qà a component's stylesheet 
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
            _data = createSignal(data, this);
            this.dataQF = filterNullElements(this.dataQF);
            this.render();
          }
          return true;
        },
        configurable: true
      }
    });

    if (this.created)
      this.created(this.data);

  }

  render() {
    let el = this.element;
    // Checks if the component's template is a string or a function.
    let template = this.template instanceof Function ? this.template(this.data) : this.template;
    template = handleRouter(template);
    // Initiate sub-components if they are available 
    template = initiateComponents(template);

    // Convert template to html 
    let rendered = jsxToHTML(template, this);
    // Set innerHTML attribute of component's element to the converted template
    el.innerHTML = rendered[0];
    currentComponent?.navigateFunc(currentComponent.data);

    this.dataQF = rendered[1];
    handleEventListener(el, this);

    for (const component of components) {
      const instance = component[1];
      if (instance.element) {
        strToEl(instance);
      }
      instance.run(instance.data);
    }

    this.run(this.data)
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


class Component {
  constructor(name, options = {}) {
    if (name) {
      globalThis[name] = this;
    }

    this.name = name;
    this.template = options?.template;
    this.run = options.run || (() => {});
    this.navigateFunc = options.onNavigate || (() => {});
    if (!this.template) throw new Error("QueFlow Error:\nTemplate not provided for Component " + name);

    this.element = `qfEl${counterQF}`;
    counterQF++;
    this.isMounted = false;
    // Creates a reactive signal for the Component's data.
    this.data = createSignal(options.data, this);

    // Asigns the value of this.data' to _data
    let _data = this.data;

    // Stores the options provided to the component.
    this.options = options;

    // Stores the current 'freeze status' of the Component
    this.isFrozen = false;

    // Stores the id of the Component's mainelement 
    this.elemId = "";

    this.created = options.created;

    // Stores the Component's stylesheet 
    this.stylesheet = options.stylesheet;

    // Stores the Component's reactive elements data
    this.dataQF = [];

    this.onUpdate = options.onUpdate;

    this.useStrict = Object.keys(options).includes('useStrict') ? options.useStrict : true;

    // Defines data property for the Component instance.
    Object.defineProperties(this, {
      data: {
        // Getters and setters for 'data' property 
        get: () => {
          return _data;
        },
        set: (data) => {
          // If 'data' is not same as 'this.data' and component is not frozem
          if (!isSame(data, this.data) && !this.isFrozen) {
            _data = createSignal(data, this);
            this.dataQF = filterNullElements(this.dataQF);
            renderComponent(this, this.name);
          }
          return true;
        },
        configurable: true,
        mutable: false
      }
    });

    if (this.created) this.created();
    components.set(name, this)
  }

  freeze() {
    // Freezes component
    this.isFrozen = true;
  }

  unfreeze() {
    // Unfreezes component
    this.isFrozen = false;
  }

  // Shows component 
  show() {
    if (this.element.style.display !== 'block') {
      this.element.style.display = 'block'
    }
  }
  // Hides component
  hide() {
    if (this.element.style.display !== 'none') {
      this.element.style.display = 'none'
    }
  }

  mount() {
    if (!this.isMounted) {
      let rendered = renderComponent(this, this.name, true);
      this.element.innerHTML = rendered;
      handleEventListener(this.element, this);
      this.isMounted = true;
    }
  }

  // removes the component's element from the DOM
  destroy() {
    const all = [this.element, ...this.element.querySelectorAll('*')];
    // Removes event listeners attached to the component's element and its child nodes
    removeEvents(all);

    this.element.remove();
  }
}

function addIndexToTemplate(str, index) {
  const regex = /\{\{[^\{\{]+\}\}/g;
  const output = str.replace(regex, (match) => {
    const inner = b(match).trim();
    return `{{ this.data[${index}].${inner} }}`;
  });
  return lintPlaceholders(output);
}

function stringToDocumentFragment(htmlString = "") {
  /**
   * Converts an HTML string into a DocumentFragment.
   *
   * @param {string} htmlString - The HTML string to convert.
   * @returns {DocumentFragment} - The DocumentFragment containing the parsed HTML.
   */
  if (typeof htmlString !== 'string') {
    throw new TypeError('Input must be a string.');
  }

  const template = document.createElement('template');
  template.innerHTML = htmlString;
  return template.content.cloneNode(true); // Clone to avoid template content issues
}

class Atom {
  constructor(name, options, id) {
    globalThis[name] = this;
    this.element = id;
    this.name = name;
    this.template = options.template;
    this.stylesheet = options.stylesheet;
    initiateStyleSheet(`#${id}`, this);
    this.data = [];
    this.index = 0;
    this.dataQF = [];
    this.useStrict = true;
    this.isReactive = options.isReactive;
  }

  renderWith(data, position = "append") {
    if (typeof data !== "object") throw new Error(`Argument passed to '${this.name}.renderWith()' must be an object or an array.`);
    this.element = typeof this.element === "string" ? document.getElementById(this.element) : this.element;
    let rendered = "";
    if (this.isReactive) {
      const processData = (item) => {
        this.data.push(item);
        const template = typeof this.template === "function" ? this.template(item, this.index) : this.template;
        const indexedTemplate = addIndexToTemplate(template, this.index);
        const init = initiateComponents(indexedTemplate);
        rendered = position == "append" ? rendered + init : init + rendered;
        this.index++;
      };

      if (Array.isArray(data)) {
        data.forEach(processData);
      } else {
        processData(data);
      }

      const [htmlContent, componentData] = jsxToHTML(rendered, this, null, true);
      const template = stringToDocumentFragment(htmlContent);
      position == "append" ? this.element.appendChild(template) : this.element.prepend(template);
      handleEventListener(this.element, this);
      this.dataQF.push(...componentData);
    } else {
      let result = "";
      if (Array.isArray(data)) {
        data.forEach((item) => {
          const template = typeof this.template === "function" ? this.template(item, this.index) : this.template;
          result = position == "append" ? result + renderTemplate(template, item, true) : renderTemplate(template, item, true) + result;
        });
      } else {
        const template = typeof this.template === "function" ? this.template(data, this.index) : this.template;
        result = renderTemplate(template, data, true);
      }
      result = jsxToHTML(lintPlaceholders(result, true), this, null)[0];
      const template = stringToDocumentFragment(result);
      position == "append" ? this.element.appendChild(template) : this.element.prepend(template);
      handleEventListener(this.element, this);
    }
  }

  set(index, value) {
    if (!this.isReactive) throw new Error(`Cannot call 'set()' on Atom '${this.name}'.\n ${this.name} is not a reactive Atom`);

    const update = (indx, val) => {
      const keys = Object.keys(val);
      keys.forEach((key) => {
        if (this.data[indx][key] !== val[key]) {
          this.data[indx][key] = val[key];
          updateComponent(indx, this, val[key], true);
        }
      });
    }

    if (typeof index == "number") {
      update(index, value);
    } else if (Array.isArray(index)) {
      index.forEach((val, indx) => (this.data[indx]) && update(indx, val));
    } else {
      console.error(`First Argument passed to '${this.name}.set()' must either be a number or an array.`);
    }
  }
}

const renderNugget = (instance, data, isExtended, children) => {
  if (instance) {
    const className = instance.className;
    // Create a variable that holds the template 
    let template = instance.template instanceof Function ? instance.template(data) : instance.template;

    if (isExtended) {
      template = template.replaceAll("</>", children);
    }

    // Parse and initiate Nested Nuggets
    const initiated = initiateNuggets(template, true);
    // Render parsed html
    let rendered = renderTemplate(initiated, data);
    const html = g(rendered, className);

    if (!instance.stylesheetInitiated) {
      // Initiate stylesheet for instance 
      initiateStyleSheet("." + className, instance, true);
      instance.stylesheetInitiated = true;
    }

    // Return processed html
    return html;
  }
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
    this.className = `nugget${nuggetCounter}`;
    // Increment the counterQF variable for later use
    nuggetCounter++;
    // Stores template 
    this.template = options.template;
    this.stylesheetInitiated = false;
    nuggets.set(name, this)
  }
}

globalThis.toPage = (path) => {
  history.pushState({}, '', path);
  loadComponent(path)
}

const loadComponent = (path) => {
  const len = routerObj.length;
  let comp404 = '';

  const changeView = (name, title) => {
    const instance = components.get(name);
    currentComponent?.hide();
    if (instance.isMounted) {
      instance.show();
    } else {
      instance.mount();
      instance.show();
    }
    document.title = title;
    currentComponent = instance;
    currentComponent.navigateFunc(currentComponent.data);
  }

  for (let i = 0; i < len; i++) {
    const { component, route, title } = routerObj[i];
    if (route === "*") {
      comp404 = component;
    }
    if (route === path) {
      changeView(component, title);
      break;
    } else {
      if (i === len - 1) {
        changeView(comp404, title)
      }
    }
  }
  navigateFunc(path);
  window.scrollTo(0, 0);
}


const Link = new Nugget('Link', {
  template: (data) => {
    const classN = data.class ? 'class={{ class }}' : '';
    return `
      <a href={{ to }} ${ classN } onclick="
        e.preventDefault()
        toPage('{{ to }}')">${ data.isBtn ? '<button>{{ label }}</button>' : '{{ label }}' }</a>`
  }
})

function handleRouter(input) {
  const routerReg = /<(Router)\s*\{([\s\S]*?)\}\s*\/>/g;
  let out = '',
    computed = '';

  if (routerReg.test(input)) {
    const extr = input.match(routerReg)[0],
      whiteSpaceIndex = extr.indexOf(" "),
      d = extr.slice(whiteSpaceIndex, -2).trim(),
      path = window.location.pathname;
    const data = Function(`return ${d}.routes`)(),
      len = data.length;

    let comp404 = '',
      isSet = false;

    computed = data.map(({ route, component }, i) => {
      data[i].component = stringBetween(component, " <", "/>");

      const name = data[i].component;
      const title = data[i].title;
      if (!title) {
        throw new Error(`QueFlow Router Error:\nTitle not set for component '${ name }'`)
      }

      let instance = components.get(name);

      if (!instance) throw new Error(`\n\nQueFlow Router Error:\nAn error occured while rendering component '${name}'`);

      if (route === "*") {
        comp404 = name;
      }

      if (route === path) {
        isSet = true;
        currentComponent = instance;
        document.title = title;
        return renderComponent(instance, name);
      } else {
        if (i === len - 1 && !isSet) {
          instance = components.get(comp404);
          currentComponent = instance;
          document.title = title;
          return renderComponent(instance, comp404);
        } else {
          const id = instance.element;
          return `<div id="${id}" display="none"></div>`;
        }
      }
    }).join('');
    routerObj = data;
    out = input.replace(extr, computed);
  } else {
    return input;
  }

  window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    loadComponent(path);
  });

  return out;
}

const onNavigate = (func, instance) => {
  navigateFunc = func.bind(instance);
}

export {
  App,
  Component,
  Nugget,
  Atom,
  onNavigate,
  globalState
};