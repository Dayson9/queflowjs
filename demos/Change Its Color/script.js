// Destructuring assignment
const { Render, createSignal } = QueFlow;

// Create a createSignal to store the color value
const data = createSignal({color: "darkorchid"});

// Render the color changer UI
Render(`
<h1 color = "{{ data.color }}" transition = ".5s">Color</h1>
<input type='text' oninput='data.color = this.value' placeholder='Enter color value'>
    `, "#app");