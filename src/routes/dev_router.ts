import {Router} from "express";
import * as extensionBuilder from "../extension";

export const DevRouter: Router = Router();

DevRouter.get("/update", (req, res) => {
  extensionBuilder.updateExtensionsJSON(true)
  .then((status) => {
    console.log(status + "Update of extensions.json complete.");
    res.send(status + "Update of extensions.json complete.");
  });
});

DevRouter.get("/:reponame/:branch", (req, res) => {
  extensionBuilder.getRepositoryDescription(`${req.params.reponame}`, `${req.params.branch}`)
  // extensionBuilder.getExtensionJSON(`${req.params.reponame}`, `${req.params.branch}`)
  .then((
    (data) => {res.send(data); }),
    (err) => {res.send("Error: " + err.message); });
});

DevRouter.get("/:reponame/", (req, res) => {
  // extensionBuilder.getRepositoryDescription(`${req.params.reponame}`)
  extensionBuilder.getExtensionReleases(req.params.reponame)
  .then((
    (data) => {res.send(data); }),
    (err) => {res.send("Error: " + err.message); });
});