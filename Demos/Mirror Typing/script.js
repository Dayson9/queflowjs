// Destructuring assignment
const { iRender, createSignal } = QueFlow;

// Create a reactive data
const data = createSignal({text: "", color: "teal"});


// Render app
iRender("#app");
