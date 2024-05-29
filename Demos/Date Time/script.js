// Destructuring assignment
const {Render, Signal} = QueFlow;

// Create a Signal to store the date and time
const date = Signal(new Date().toLocaleString());

// Render date and time information
Render(`<h1>Date Time</h1>\n<b>Date and time is : {{date.value}} {{ console.log(QueFlow)}}</b>\n`, "#app");

// Update date and time every second
setInterval(() => {
  date.value = new Date().toLocaleString();
}, 1000);