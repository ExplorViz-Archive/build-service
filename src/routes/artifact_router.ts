import { Request, Response, Router } from "express";

import { Extension } from "../extension";
import { Task } from "../task";
import { Config, getConfig } from "../config";

const router: Router = Router();
const config: Config = getConfig();
const tasks: { [_: string]: Task; } = {};

export async function startBuildTask(exts: Extension[]) {
    const task = Task.getTask(exts);
    tasks[task.getToken()] = task;
    return task.getToken();
}

router.get("/status/:token", (req, res) => {
  const { token } = req.params;
  const task = tasks[token];
  if (task === undefined) {
      res.end("notfound");
  } else {
      res.end(task.getStatus());
  }
});

router.get("/download/:token", (req, res) => {
    const { token } = req.params;
    const task = tasks[token];
    if (task === undefined) {
        res.end("notfound");
    } else {
        res.download(config.cachePath + "/" + task.getToken() + ".zip", "explorviz-configuration.zip");
    }
});

export const ArtifactRouter: Router = router;
