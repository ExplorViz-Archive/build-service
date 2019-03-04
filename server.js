const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const extensionBuilder = require('./extension.js');

const app = express();

const ipAdress = "192.168.178.52";

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/config', (req, res) => {
  res.render('config');
});

app.get('/config_1', (req, res) => {
  res.render('config_1');
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
  extensions = JSON.parse(fs.readFileSync('extensionList.json'));
  res.send(extensions);
});

app.get('/static/img/:imgUrl', (req, res) => {
  res.sendFile(path.join(__dirname, `public/img/${req.params.imgUrl}`));
});

app.get('/description/:reponame/:branch', (req, res) => {
  extensionBuilder.getRepositoryDescription(`${req.params.reponame}`, `${req.params.branch}`)
  .then((
    data => {res.send(data)}), 
    err => {res.send("Error: " + err.message)});
});

app.get('/description/:reponame/', (req, res) => {
  extensionBuilder.getRepositoryDescription(`${req.params.reponame}`)
  .then((
    data => {res.send(data)}), 
    err => {res.send("Error: " + err.message)});
});

app.get('/update', (req, res) => {
  extensionBuilder.updateExtensionsJSON()
  .then(() => res.send("update complete."));
});

const server = app.listen(8080, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});

// const server = app.listen(8080, `${ipAdress}`, () => {
//   console.log(`Express running → PORT ${ipAdress}:${server.address().port}`);
// });