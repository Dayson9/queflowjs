// Destructuring assignment
const {iRender, Signal} = QueFlow;

// Create a reactive data
const data = Signal({text: ""});


// Render app
iRender("#app");
