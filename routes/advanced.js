const express = require('express'),
  path = require('path'),
  advanced = express.Router(),
  app = express();

const fetchFile = str => path.join(__dirname, '..', '/docs/build', str);

advanced.get("/", (req, res) => {
  res.sendFile(fetchFile("advanced.html"));
});

advanced.get("/qcomponent", (req, res) => {
  res.sendFile(fetchFile("qcomponent.html"));
});

advanced.get("/template", (req, res) => {
  res.sendFile(fetchFile("template.html"));
});

advanced.get("/direct-css", (req, res) => {
  res.sendFile(fetchFile("direct_css.html"));
});

advanced.get("/nuggets", (req, res) => {
  res.sendFile(fetchFile("nuggets.html"));
});

advanced.get("/subcomponents", (req, res) => {
  res.sendFile(fetchFile("subcomponents.html"));
});

app.use(express.static('docs/build'));

module.exports = advanced;