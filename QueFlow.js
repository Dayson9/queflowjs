var QueFlow = {
dataQF: [],
counterQF: 0,
select: (qfid) => {
let el = document.querySelector("[data-qfid="+qfid+"]");
return el;
},

tempLen: (temp) => {
if(!temp){
temp = "";
}

let len = 0, reg, reg1, x, x1;

reg = /\{\{/g;
reg1 = /\}\}/g;

x = (temp.match(reg) == null ? 0 : temp.match(reg));
x1 = (temp.match(reg1) == null ? 0 : temp.match(reg1));


if(x.length > x1.length){
len = x.length;
}else{
len = x1.length;
}


return len;
},

notEvent : (str) => {
let reg = /^[on]{1}.{1,}$/;
return (reg.test(str) === true) ? false: true;
},

needsUpdate: (temp, key, len) => {
let objName, decision = false;


if(!temp){
temp = ""
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
v = QueFlow.needsUpdate(pieces.template, key, len);

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

parentType: (element) =>{
let children = element.querySelectorAll("*");

if(children.length > 0){
return [true, children];
}else{
return [false];
}
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
let div = document.createElement("div"), children, out;

div.innerHTML = jsx;

children = div.querySelectorAll("*");

for(c of children){
let attr = QueFlow.attr(c);
c.dataset.qfid = "qf"+QueFlow.counterQF;
QueFlow.counterQF++;

let ch = QueFlow.parentType(c);

if(ch[0]){
out = QueFlow.parseQF(attr, div.innerHTML, c.dataset.qfid)[0];
}else{
attr.push({
attribute: "innerText",
value: c.innerText
});
out = QueFlow.parseQF(attr, div.innerHTML, c.dataset.qfid)[0];
}
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

Render: (jsx, app) => {
QueFlow.Ln(true);
app.innerHTML = QueFlow.jsxToHTML(jsx);
QueFlow.Ln(false);
}, 

iRender: (app) => {
if(QueFlow.parentType(app)[0]){
QueFlow.Ln(true);
app.innerHTML = QueFlow.jsxToHTML(app.innerHTML);
QueFlow.Ln(false);
}
}
};

Object.freeze(QueFlow);