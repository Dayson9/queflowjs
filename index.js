const express = require('express'),
  path = require('path'),
  app = express(),
  apis = require("./routes/apis.js");

const port = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.sendFile(__dirname + "/docs/build/getting_started.html");
});

app.get('/getting-started', (req, res) => {
  res.sendFile(__dirname + "/docs/build/getting_started.html");
});

app.get('/demos', (req, res) => {
  res.sendFile(__dirname + "/docs/build/demos.html");
});

app.use(express.static('docs/build'));
app.use("/apis", apis);

app.listen(port);
