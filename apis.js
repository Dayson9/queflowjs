const express = require('express');
const apis = express.Router();
const app = express();

apis.get("/", (req, res) => {
  res.sendFile(__dirname+"/docs/build/apis.html");
});

apis.get("/render", (req, res) => {
  res.sendFile(__dirname+"/docs/build/render.html");
});

apis.get("/irender", (req, res) => {
  res.sendFile(__dirname+"/docs/build/irender.html");
});

apis.get("/signal", (req, res) => {
  res.sendFile(__dirname+"/docs/build/signal.html");
});

app.use(express.static('docs/build'));

module.exports = apis;
