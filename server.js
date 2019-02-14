const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const app = express()

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/config', (req, res) => {
  res.render('config_1');
});

app.get('/config_1', (req, res) => {
  res.render('config');
});

app.get('/config_2', (req, res) => {
  res.render('config_2');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/confirmation', (req, res) => {
  res.render('confirmation');
});

app.get('/static/extensions', (req, res) => {
  extensions = JSON.parse(fs.readFileSync('extensions.json'));
  res.send(extensions);
});

app.get('/static/img/:imgUrl', (req, res) => {
  res.sendFile(path.join(__dirname, `public/img/${req.params.imgUrl}`));
});

const server = app.listen(8080, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});

