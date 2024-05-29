// Destructuring assignment
const {iRender, Signal} = QueFlow;

// Create a reactive data
const counter = Signal(1);

// Render app
iRender("#app");