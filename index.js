const express = require('express');
const path = require('path');
const app = express();
const apis = require("./apis.js");

const port = process.env.PORT || 3000;
const key = process.env.key;


app.get('/', (req, res) => {
  res.sendFile(__dirname+"/docs/build/getting_started.html");
});

app.get('/getting-started', (req, res) => {
  res.sendFile(__dirname+"/docs/build/getting_started.html");
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname+"/docs/build/about.html");
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname+"/docs/build/contact.html");
});

app.get('/donate', (req, res) => {
  res.sendFile(__dirname+"/docs/build/donate.html");
});

app.use(express.static('docs/build'));
app.use("/apis", apis);

app.listen(port);
