// Destructuring assignment
const {Render, Signal} = QueFlow;

// Create a Signal to store the color value
const data = Signal({color: "darkorchid"});

// Render the color changer UI
Render("<h1 style='color: {{data.color}}; transition: .5s;'>Color</h1>\n<input type='text' oninput='data.color = this.value' placeholder='Enter color value'>\n", "#app");