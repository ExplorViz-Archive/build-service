
import * as bodyParser from "body-parser";
import express = require ("express");
import * as fs from "fs-extra";
import * as schedule from "node-schedule";
import * as path from "path";
import {ArtifactRouter} from "./artifact_router";
import {Config, createDefaultConfig} from "./config";
import * as extensionBuilder from "./extension";

const app = express();
let config: Config;
try {
  config = fs.readJsonSync("config.json");
} catch (error) {
  console.log("No config.json found. Generating new file.");
  config = createDefaultConfig();
  fs.writeJSONSync("config.json", config, {spaces:2});
}
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

app.use("/artifact", ArtifactRouter);

// app.get('/config_1', (req, res) => {
//   res.render('config_1');
// });

// app.get('/config_2', (req, res) => {
//   res.render('config_2');
// });

app.get("/imprint", (req, res) => {
  res.render("imprint");
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
  console.log(`ExplorViz-build-service running at [${getCurrentUTCTime(1)}]`
    + ` → PORT ${(server.address() as any).port}`);
  console.log("Updating extensionList.json every full hour.");
    // });

  const rule = new schedule.RecurrenceRule();
  rule.minute = 0;
  const repeat = schedule.scheduleJob(rule, () => {
    let date = new Date();
    date = new Date(date.getTimezoneOffset());
    console.log(`Updating extensions.json at ${getCurrentUTCTime(1)} ...`);
    extensionBuilder.updateExtensionsJSON(true)
    .then((status) => console.log(status + "Update of extensions.json complete."));
  });
});

function getCurrentUTCTime(offset : number = 0) {
  let date = new Date();
  date = new Date(date.getTime() + date.getTimezoneOffset()+ offset * 60000);
  return date.toLocaleTimeString();
}