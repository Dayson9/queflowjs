const express = require('express');
const path = require('path');
const app = express();
const router = express.Router();


const port = process.env.PORT || 3000;
const key = process.env.key;

app.listen(port);

app.get('/', (req, res) => {
  res.sendFile(__dirname+"/dist/landing_page.html");
});

app.get('/getting-started', (req, res) => {
  res.sendFile(__dirname+"/dist/getting_started.html");
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname+"/dist/about.html");
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname+"/dist/contact.html");
});

app.get('/donate', (req, res) => {
  res.sendFile(__dirname+"/dist/donate.html");
});

app.use(express.static('dist'));

app.use(express.raw({ type: '*/*', limit: '1mb' }));