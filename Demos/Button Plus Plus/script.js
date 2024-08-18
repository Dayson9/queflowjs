// Destructuring assignment
const { iRender, createSignal } = QueFlow;

// Create a reactive data
const counter = createSignal(0);

// Render app
iRender("#app");