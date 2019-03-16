import express = require ("express");
import * as fs from "fs-extra";
import * as schedule from "node-schedule";
import * as path from "path";
import {Config, createDefaultConfig} from "./config";
import {ArtifactRouter} from "./routes/artifact_router";
import {BuildRouter} from "./routes/build_router";
import {ConfirmationRouter} from "./routes/confirmation_router";
import {StaticRouter} from "./routes/static_router";
import { DevRouter } from "./routes/dev_router";

const app = express();
let config: Config;
try {
  config = fs.readJsonSync("config.json");
} catch (error) {
  console.log("No config.json found. Generating new file.");
  config = createDefaultConfig();
  fs.writeJSONSync("config.json", config, {spaces: 2});
}

app.set( "views", path.join( __dirname, "views" ) );
app.set("view engine", "ejs");
app.set("json replacer", null);
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join( __dirname, "public" )));

app.use("/artifact", ArtifactRouter);
app.use("/build", BuildRouter);
app.use("/confirmation", ConfirmationRouter);
app.use("/static", StaticRouter);
app.use("/dev", DevRouter);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/config", (req, res) => {
  res.render("config");
});

app.get("/imprint", (req, res) => {
  res.render("imprint");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

// const ipAdress = "192.168.178.52";

// const server = app.listen(8080, `${ipAdress}`, () => {
const server = app.listen(config.port, config.host, () => {
  // extensionBuilder.updateExtensionsJSON(true);
  // .then((status) => {
  //   console.log(status + "Update of extenList.json complete.");
  //   console.log(`ExplorViz-build-service running at [${new Date().toUTCString()}] `
  console.log(`ExplorViz-build-service running at [${new Date().toLocaleTimeString()}]`
    // + `→ PORT ${ipAdress}:${(server.address() as any).port}`);
    + ` → PORT ${(server.address() as any).port}`);
  // console.log(`Updating extensionList.json every hour at ${new Date().getMinutes()} minutes.`);
  //   // });
  // const rule = new schedule.RecurrenceRule();
  // rule.minute = new Date().getMinutes();
  // schedule.scheduleJob(rule, () => {
  //   console.log(`Updating extenList.json at ${new Date().toLocaleTimeString()} ...`);
  //   extensionBuilder.updateExtensionsJSON(true)
  //   .then((status) => console.log(status + "Update of extenList.json complete."));
  // });
});
