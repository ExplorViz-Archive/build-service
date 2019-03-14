import { Request, Response, Router } from "express";

import {getConfiguration} from "../artifact_builder";
import { Extension, ExtensionType } from "../extension";
import { Task } from "../task";

const router: Router = Router();

const tasks: { [_: string]: Task; } = {};

export function startBuildTask(exts: Extension[]) {
    const task = new Task(exts);
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
        res.end(task.getDownload());
    }
});

export const ArtifactRouter: Router = router;
