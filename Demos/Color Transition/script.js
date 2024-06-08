const {iRender, Signal} = QueFlow, colours = ["crimson", "red", "orange", "green" , "lightgreen",  "cyan", "skyblue", "lightblue", "cornflowerblue", "dodgerblue", "pink","hotpink", "purple", "darkorchid", "indigo", "violet"];
var counter = 0;
// Create a reactive data
const color = Signal(colours[0]);

// Render app
iRender("#app");

// Color transition animation
setInterval(() =>{
color.value = colours[counter];
if(counter != colours.length-1){
counter++;
}else{
counter = 0;
}
}, 500);
console.log(QueFlow.dataQF);