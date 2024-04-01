var QueFlow = {
dataQF: [],
counterQF: 0,
select: (qfid) => {
let el = document.querySelector("[data-qfid="+qfid+"]");
return el;
},

tempLen: (temp) => {
let len = 0, reg, reg1, x;
reg = /\{\{[a-zA-Z]{1,}[0-9]{0,}[\.]{1}[a-zA-Z]{1,}[0-9]{0,}\}\}/g;
reg1 = /\{\{.{1,}\}\}/g;

x = temp.match(reg);

if(x === null){
len = (temp.match(reg1) === null)? 0: temp.match(reg1).length;
}else{
len = x.length;
}

return len;
},

notEvent : (str) => {
let reg = /^[on]{1}.{1,}$/;
return (reg.test(str) === true)? false: true;
},

needsUpdate: (temp, key, value, len) => {
let i, ext, objName, e, decision = false;

for(i = 0; i < len; i++){
ext = QueFlow.strBetween(temp, "{{", "}}");
objName = ext.slice(0, ext.indexOf("."));
e = (new Function("return "+objName+"."+key))();
if(e === value){
decision = true;
temp = QueFlow.convert(len, temp);
break;
}
}
return [decision, temp];
},


Signal: (item) => {
if(typeof item != "object"){
item = {value: item};
}
let handler = {
set(target, key, value) {

target[key] = value;
let v, len, el;
for(pieces of QueFlow.dataQF){
	
len = QueFlow.tempLen(pieces.template);
el = QueFlow.select(pieces.qfid);	
v = QueFlow.needsUpdate(pieces.template, key, value, len);

if(v[0]){
if(QueFlow.notEvent(pieces.key)){
if(pieces.key === "class"){
el[pieces.key+"Name"] = v[1];
}else{
el[pieces.key] = v[1];
}

}
}
}
}
}
proxxy = new Proxy(item, handler);
return proxxy;
},

dom: (tagName, attribs = [], ...children) =>{
let el = document.createElement(tagName);
let len = attribs.length;
let i;
for(i=0; i<len; i++){
let attrib = attribs[i].attribute;
let value = attribs[i].value;
el.setAttribute(attrib, value);
};

children.forEach((child) =>{
if(child instanceof Node){
el.appendChild(child);
}else{
el.innerHTML+= child;
}
});

return el;
},

strBetween: (str, f, s) => {
  let out = "";
 
  let indexF = str.indexOf(f)+2;
  let indexS = str.indexOf(s);
  out = str.slice(indexF, indexS);

  return out;
},

convert: (len, reff) => {
let extracted, parsed;

for(i=0; i<len; i++){
if(reff.includes("{{") && reff.includes("}}")){
extracted = QueFlow.strBetween(reff, "{{", "}}");
parsed = (new Function("return "+extracted))();
reff = reff.replace("{{"+extracted+"}}", parsed);
}
}

return reff;
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
component.push({template: arr.value, key: arr.attribute, qfid: id});
});

cpy = QueFlow.dataQF;
QueFlow.dataQF= [...cpy, ...component];

return [parsed, component];
},

jsxToHTML: (jsx) => {
let out = [], jsx2, attrs = [], qf = document.createElement("div"), el;
qf.innerHTML = jsx;
el = qf.querySelector("*");

el.dataset.qfid = "qf"+QueFlow.counterQF;
QueFlow.counterQF++;
attrs = QueFlow.attr(el);

attrs.push({
  attribute: "innerText", 
  value: el.innerText
});


jsx2 = QueFlow.parseQF(attrs, jsx, el.dataset.qfid);

qf.innerHTML = jsx2[0];
el = qf.querySelector("*");
attrs = QueFlow.attr(el);
el.dataset.qfid = "qf"+(QueFlow.counterQF-1);
attrs.push({attribute: "data-qfid", value: el.dataset.qfid});

out = {html: jsx2, tag: el.tagName, options: attrs, inner: el.innerText, arr: jsx2[1]};

qf.remove();


return out;
},

Rend: (jsxarr, app) => {
let htm, element;
QueFlow = {...QueFlow};

for(r of jsxarr){
htm = QueFlow.jsxToHTML(r);
element = QueFlow.dom(htm.tag, htm.options, htm.inner);
app.appendChild(element);
}

Object.freeze(QueFlow);
},

Render: (jsx, app) => {
  let div = document.createElement("div"), arr = [], children, refined;
  
if(typeof jsx == "function"){
refined = jsx();
}else{
refined = jsx;
}

div.innerHTML = refined;
children = div.querySelectorAll("*");
div.innerHTML = "";

children.forEach((child) => {
div.appendChild(child);
arr.push(div.innerHTML);
div.innerHTML = "";
});

QueFlow.Rend(arr, app);
}, 

iRender: (app) => {
let div = document.createElement("div"), children = app.querySelectorAll("*"), jsx, htm, el, arr = [];

app.innerHTML = "";

if(children.length > 0){
children.forEach((child) => {
div.appendChild(child);
jsx = div.innerHTML;
arr.push(jsx);
div.innerHTML = "";
});
}

QueFlow.Rend(arr, app);
}
};

Object.freeze(QueFlow)
