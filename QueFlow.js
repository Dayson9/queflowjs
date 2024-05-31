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

        decision = temp.includes(key);

        return [decision, QueFlow.convert(len, temp)];
    },
    
    filterEls: () =>{
    QueFlow.Ln(true);
    QueFlow.dataQF = QueFlow.dataQF.filter((data) =>{
    let el = QueFlow.select(data.qfid);
    if(el){
    return data;
    }
    });
    QueFlow.Ln(false);
    },
    
    updateDOM: (key) =>{
        let v, len, el;
        QueFlow.filterEls();
        for(let pieces of QueFlow.dataQF){
	
        len = QueFlow.tempLen(pieces.template);

        if (pieces.qfid != "") {
        el = QueFlow.select(pieces.qfid);
        if(el){
        v = QueFlow.needsUpdate(pieces.template, key, len);
        if (v[0]) {
        if (QueFlow.notEvent(pieces.key)) {
        if (pieces.key === "class") {
        el[pieces.key+"Name"] = v[1];
        }else{
        el[pieces.key] = v[1];
             }
        }else{
        el.addEventListener(pieces.key.slice(2), v[1]);
             }
           }
        }else{
           console.error("An error occurred while updating the DOM");
           }
         }
       }
     },

    Signal: (data) => {
        let item = (typeof data != "object")? {value: data} : JSON.parse(JSON.stringify(data));
        let proxy;

        let handler = {
        set(target, key, value) {
        target[key] = value;
        QueFlow.updateDOM(key);
        }
        }
        proxy = new Proxy(item, handler);
        return proxy;
   },

    parentType: (element) =>{
        let children = element.querySelectorAll("*") || 0;
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
      let output = "";
        let indexF = str.indexOf(f)+2, indexS = str.indexOf(s);
        output = str.slice(indexF, indexS);
        return (!output) ? "" : output;
    },
      
      convert: (len, reff) => {
       let out = reff, i = 0, extracted = "", parsed = "";
       try{
       for(i = 0; i < len; i++){
       extracted = QueFlow.strBetween(out, "{{", "}}");
       parsed = Function('"use-strict"; return '+extracted)();
       out = out.replaceAll("{{"+extracted+"}}", parsed);
       }
       }
       catch (error) {
       console.error("An error occurred while parsing JSX/HTML", error);
       }
       return out;
      },
      
    attr: (el) => {
        let arr = [];
        try{
        let att, i = 0, atts = el.attributes, n = atts.length;
        for (i =0; i < n; i++){
        att = atts[i];
        arr.push({attribute: att.nodeName, value: att.nodeValue});
        }
        } catch (error) {
        console.error("An error occurred while getting the attributes of "+el, error);
        }
        return arr;
    },

    parseQF: (arg, ref, id = "") => {
        let component = [], parsed, len, cpy;

        len = QueFlow.tempLen(ref);
        arg.forEach((arr) =>{
        if(arr.value.includes("{{") && arr.value.includes("}}")){
        component.push({template: arr.value, key: arr.attribute, qfid: id});
        }
        });

        cpy = QueFlow.dataQF;
        QueFlow.dataQF= [...cpy, ...component];
        
       parsed = QueFlow.convert(len, ref);
        return parsed;
    },

    jsxToHTML: (jsx) => {
        let div = document.createElement("div"), children, out, inner = "";

        div.innerHTML = jsx;
        try{
        children = div.querySelectorAll("*");
        children.forEach((c) =>{
        if(!QueFlow.parentType(c)[0]){
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
        });
         }  catch (error) {
           console.error("An error occurred while processing JSX/HTML", error);
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

    Render: (jsx, selector) => {
        let app = document.querySelector(selector);
        if(app){
        QueFlow.Ln(true);
        app.innerHTML = QueFlow.jsxToHTML(jsx);
        QueFlow.Ln(false);
        }else{
        console.error("An element with the provided selector: ", selector, "does not exist");
        }
    }, 

    iRender: (selector) => {
        let app = document.querySelector(selector);
        if(app){
        if(QueFlow.parentType(app)[0]){
        QueFlow.Ln(true);
        app.innerHTML = QueFlow.jsxToHTML(app.innerHTML);
        QueFlow.Ln(false);
        }
        }else{
        console.error("An element with the provided selector: ", selector, "does not exist");
        }
        }
};

Object.freeze(QueFlow);
