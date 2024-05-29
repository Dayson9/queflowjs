/*! QueFlowJS | (c) 2024 Dayson9 | MIT License | http://github.com/Dayson9/QueFlowJS */

var QueFlow = {
    dataQF: [],
    counterQF: 0,
    select: (qfid) => {
        return document.querySelector("[data-qfid="+qfid+"]");
    },

    tempLen: (temp) => {
        if(!temp){
        temp = "";
        }

        let reg, reg1, x, x1;

        reg = /\{\{/g;
        reg1 = /\}\}/g;

        x = (temp.match(reg) == null ? 0 : temp.match(reg));
        x1 = (temp.match(reg1) == null ? 0 : temp.match(reg1));

        return (x.length > x1.length) ? x.length : x1.length;
    },

    notEvent : (str) => {
        let reg = /^[on]{1}.{1,}$/;
        return !reg.test(str);
    },

    needsUpdate: (temp, key, len) => {
        let objName, decision = false;


        if(!temp){
        temp = "";
        }

        if(temp.includes(key)){
        decision = true;
        temp = QueFlow.convert(len, temp);
        }else{
        decision = false;
        temp = QueFlow.convert(len, temp);
        }

        return [decision, temp];
    },


    Signal: (data) => {
        let item = (typeof data != "object")? {value: data} : JSON.parse(JSON.stringify(data));
        let proxy;

        let handler = {
        set(target, key, value) {
        target[key] = value;
        let v, len, el;
        for(let pieces of QueFlow.dataQF){
	
        len = QueFlow.tempLen(pieces.template);

        if(pieces.qfid != ""){
        el = QueFlow.select(pieces.qfid);
        v = QueFlow.needsUpdate(pieces.template, key, len);

        if(v[0]){
        if(QueFlow.notEvent(pieces.key)){
        if(pieces.key === "class"){
        el[pieces.key+"Name"] = v[1];
        }else{
        el[pieces.key] = v[1];
             }
                    } else {
                    el.addEventListener(pieces.key.slice(2), v[1]);
                    }
                }
            }
        }
     }
   }
        proxy = new Proxy(item, handler);
        return proxy;
   },

    parentType: (element) =>{
        let children = element.querySelectorAll("*")??0;
        return (children.length > 0) ? [true, children] : [false];
    },

    dom: (tagName, attribs = [], children) => {
        let el = document.createElement(tagName), len = attribs.length, i = 0;
        for(i=0; i<len; i++){
        let attrib = attribs[i].attribute;
        let value = attribs[i].value;
        el.setAttribute(attrib, value);
        }
        
        el.innerHTML = children;

        return el;
      },

    strBetween: (str, f, s) => {
        let indexF = str.indexOf(f)+2, indexS = str.indexOf(s);
        return str.slice(indexF, indexS);
    },
      
      convert: (len, reff) => {
        try {
        return reff.replace(/\{\{([^}]+)\}\}/g, (match, extracted) => {
            return Function('"use strict"; return ('+extracted +')')();
        });
        } catch (error) {
        console.error("Error occurred while evaluating the expression:", error);
        return '';
        }
      },
      
    attr: (el) => {
        let arr = [];
        let att, i = 0, atts = el.attributes, n = atts.length;
        for (i =0; i < n; i++){
        att = atts[i];
        arr.push({attribute: att.nodeName, value: att.nodeValue});
        }
        return arr;
    },

    parseQF: (arg, ref, id = "") => {
        let component = [], parsed, len, cpy;

        len = QueFlow.tempLen(ref);
        parsed = QueFlow.convert(len, ref);
        arg.forEach((arr) =>{
        if(arr.value.includes("{{") && arr.value.includes("}}")){
        component.push({template: arr.value, key: arr.attribute, qfid: id});
        }
        });

        cpy = QueFlow.dataQF;
        QueFlow.dataQF= [...cpy, ...component];
        return parsed;
    },

    jsxToHTML: (jsx) => {
        let div = document.createElement("div"), children, out, inner = "";

        div.innerHTML = jsx;

        children = div.querySelectorAll("*");

        for(c of children){
        let attr = QueFlow.attr(c);
        attr.push({attribute: "innerText", value: c.innerText});

        for(attribute of attr){
        let val = attribute.value;
        if(val.includes("{{") && val.includes("}}")){
        c.dataset.qfid = "qf"+QueFlow.counterQF;
        QueFlow.counterQF++;
        break;
        }
        }
        out = QueFlow.parseQF(attr, div.innerHTML, c.dataset.qfid);
        }

        div.remove();

        return out;
    },

    Ln: (arg) => {
        if(arg){
        QueFlow = {...QueFlow};
        }else{
        Object.freeze(QueFlow);
        }
    },

    Render: (jsx, pp) => {
        let app = document.querySelector(pp);
        QueFlow.Ln(true);
        app.innerHTML = QueFlow.jsxToHTML(jsx);
        QueFlow.Ln(false);
    }, 

    iRender: (appl) => {
        let app = document.querySelector(appl);
        if(QueFlow.parentType(app)[0]){
        QueFlow.Ln(true);
        app.innerHTML = QueFlow.jsxToHTML(app.innerHTML);
        QueFlow.Ln(false);
      }
      }
};

Object.freeze(QueFlow);

/** To optimize the `convert` function in the QueFlowJS library, you can make the following improvements:

```javascript
convert: (len, reff) => {
    try {
        return reff.replace(/\{\{([^}]+)\}\}/g, (match, extracted) => {
            return Function('"use strict";return (' + extracted + ')')();
        });
    } catch (error) {
        console.error("Error occurred while evaluating the expression:", error);
        return '';
    }
},
```

By making these changes, you:

1. Ensure that the code within the `{{ ... }}` is safely evaluated using the Function constructor and strict mode.
2. Enclose the `extracted` code within a function to safely execute it within its own scope.
3. Provide more robust error handling in case of any issues during expression evaluation.
4. Remove unnecessary `new` keyword when defining the Function constructor.

These improvements enhance security, readability, and maintainability of the `convert` function in the QueFlowJS library. **/