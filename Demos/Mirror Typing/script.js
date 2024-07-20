// Destructuring assignment
const {iRender, createSignal} = QueFlow;

// Create a reactive data
const data = createSignal({text: ""});


// Render app
iRender("#app");
