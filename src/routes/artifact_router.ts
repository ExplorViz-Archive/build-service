import { Request, Response, Router } from "express";

import {resolveCommit} from "../artifact_builder";
import { Extension, ExtensionType } from "../extension";
import { Task } from "../task";

const router: Router = Router();

const tasks: { [_: string]: Task; } = {};

export async function startBuildTask(exts: Extension[]) {
    // Convert named versions to commit hashes.
    // this allows us to differentiate between
    // different versions on a branch (e.g. master)
    for(let i = 0; i < exts.length; ++i)
    {
        exts[i].version = await resolveCommit(exts[i]); 
    }

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
        res.end(task.getDownload());
    }
});

export const ArtifactRouter: Router = router;
