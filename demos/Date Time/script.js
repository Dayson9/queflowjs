// Destructuring assignment
const { Render, createSignal } = QueFlow;

// Create a createSignal to store the date and time
const date = createSignal(new Date().toLocaleString());

// Render date and time information
Render(`
<h1 color = "teal" font-size = "30px" font-family = "sans-serif">Date Time</h1>
    <b color = "dodgerblue">Date and time is : {{ date.value }}</b>
`, "#app");

// Update date and time every second
setInterval(() => {
  date.value = new Date().toLocaleString();
}, 1000);