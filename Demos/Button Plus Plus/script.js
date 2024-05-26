// Destructuring assignment
const {iRender, Signal} = QueFlow;

// Create a reactive data
const counter = Signal(0);

// Render app
iRender("#app");