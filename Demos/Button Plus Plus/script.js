// Destructuring assignment
const { iRender, createSignal } = QueFlow;

// Create a reactive data
const counter = createSignal(1);

// Render app
iRender("#app");