// Destructuring assignment
const {Render, Signal} = QueFlow;

// Create a Signal to store the date and time
const date = Signal(new Date().toLocaleString());

// Render date and time information on the web page
Render(`<h1>Date Time</h1>\n<bold style='color: dodgerblue;'>Date and time is : {{date.value}}</bold>\n`, "#app");

// Update date and time every second

setInterval(() => {
  date.value = new Date().toLocaleString();
}, 1000);
