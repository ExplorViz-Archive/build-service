
import * as bodyParser from "body-parser";
import express = require ("express");
import * as fs from "fs-extra";
import * as schedule from "node-schedule";
import * as path from "path";
import * as extensionBuilder from "./extension";
import {Config} from "./config"
import { Extension, ExtensionType } from './extension';
import { Task } from './task';

const app = express();
const config: Config = require('../config.json');

// const ipAdress = "192.168.178.52";

app.set( "views", path.join( __dirname, "views" ) );
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join( __dirname, "public" )));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/config", (req, res) => {
  res.render("config");
});

let tasks = {};
app.post('/',function(req,res){
  const token = Math.random().toString(36).substring(2);
  let extensions: Array<Extension> = [];
  if(req.body.extension1 !== undefined && req.body.extension1 !== "")
      extensions.push(new Extension(req.body.extension1, "master", ExtensionType.FRONTEND, req.body.extension1));
  if(req.body.extension2 !== undefined && req.body.extension2 !== "")
      extensions.push(new Extension(req.body.extension2, "master", ExtensionType.BACKEND, req.body.extension2));
  tasks[token] = new Task(extensions);
  res.end(token);
});

app.get("/token/:token", (req, res) => 
{
  let { token } = req.params;
  const task = tasks[token];
  if(task === undefined)
      res.end("notfound");
  else 
      res.end(task.getStatus());
});


// app.get('/config_1', (req, res) => {
//   res.render('config_1');
// });

// app.get('/config_2', (req, res) => {
//   res.render('config_2');
// });

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/confirmation", (req, res) => {
  res.render("confirmation");
});

app.get("/static/extensions", (req, res) => {
  const extensions = fs.readJsonSync("extensionList.json");
  res.send(extensions);
});

app.get("/static/img/:imgUrl", (req, res) => {
  res.sendFile(path.join(__dirname, `/public/img/${req.params.imgUrl}`));
});

app.get("/description/:reponame/:branch", (req, res) => {
  extensionBuilder.getRepositoryDescription(`${req.params.reponame}`, `${req.params.branch}`)
  .then((
    (data) => {res.send(data); }),
    (err) => {res.send("Error: " + err.message); });
});

app.get("/description/:reponame/", (req, res) => {
  extensionBuilder.getRepositoryDescription(`${req.params.reponame}`)
  .then((
    (data) => {res.send(data); }),
    (err) => {res.send("Error: " + err.message); });
});

app.get("/update", (req, res) => {
  extensionBuilder.updateExtensionsJSON(true)
  .then((status) => {
    console.log(status + "Update of extensions.json complete.");
    res.send(status + "Update of extensions.json complete.");
  });
});

// const server = app.listen(8080, `${ipAdress}`, () => {
const server = app.listen(config.port, config.host, () => {
  // extensionBuilder.updateExtensionsJSON(true);
  // .then((status) => {
  //   console.log(status + "Update of extensions.json complete.");
  //   console.log(`ExplorViz-build-service running at [${new Date().toUTCString()}] `
  //   + `→ PORT ${ipAdress}:${server.address().port}`);
  console.log(`ExplorViz-build-service running at [${new Date().toUTCString()}]`
    + ` → PORT ${(server.address() as any).port}`);
  console.log("Updating extensionList.json every full hour.");
    // });

  const rule = new schedule.RecurrenceRule();
  rule.minute = 0;
  const repeat = schedule.scheduleJob(rule, () => {
    const date = new Date();
    console.log(`Updating extensions.json at ${date.toUTCString()} ...`);
    extensionBuilder.updateExtensionsJSON(true)
    .then((status) => console.log(status + "Update of extensions.json complete."));
  });
});
