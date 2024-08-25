const express = require('express'),
  path = require('path'),
  apis = express.Router(),
  app = express();

const fetchFile = str => path.join(__dirname, '..', '/docs/build', str);

apis.get("/", (req, res) => {
  res.sendFile(fetchFile("apis.html"));
});

apis.get("/render", (req, res) => {
  res.sendFile(fetchFile("render.html"));
});

apis.get("/irender", (req, res) => {
  res.sendFile(fetchFile("irender.html"));
});

apis.get("/signal", (req, res) => {
  res.sendFile(fetchFile("signal.html"));
});

app.use(express.static('docs/build'));

module.exports = apis;