import express = require ("express");
import * as fs from "fs-extra";
import * as schedule from "node-schedule";
import * as path from "path";
import {Config, getConfig} from "./config";
import {ArtifactRouter} from "./routes/artifact_router";
import {BuildRouter} from "./routes/build_router";
import {ConfirmationRouter} from "./routes/confirmation_router";
import {StaticRouter} from "./routes/static_router";
import { DevRouter } from "./routes/dev_router";
import {updateExtensionsJSON} from "./extension"

const app = express();
const config = getConfig();

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
if (config.devOptions) {
  app.use("/dev", DevRouter);
}

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

const ipAdress = config.host;
const port = config.port;

const server = app.listen(port, `${ipAdress}`, () => {
  // updateExtensionsJSON()
  // .then((status) => {
  //   console.log(`Update of extensionList.json ${status}.`);
    console.log(`ExplorViz-build-service running at [${new Date().toLocaleTimeString()}]`
    + ` → ${ipAdress}:${(server.address() as any).port}`);
  console.log(`Updating extensionList.json every hour at ${new Date().getMinutes()} minutes.`);
    // });
  const rule = new schedule.RecurrenceRule();
  rule.minute = new Date().getMinutes();
  schedule.scheduleJob(rule, () => {
    console.log(`Updating extenList.json at ${new Date().toLocaleTimeString()} ...`);
    updateExtensionsJSON()
    .then((status) => console.log(`Update of extensionList.json ${status}.`));
  });
});
