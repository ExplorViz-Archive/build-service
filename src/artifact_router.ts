import { Request, Response, Router } from "express";

import {getConfiguration} from "./artifact_builder";
import { Extension, ExtensionType } from "./extension";
import { Task } from "./task";

const router: Router = Router();

const tasks: { [_: string]: Task; } = {};
router.post("/", (req, res) => {
  const extensions: Extension[] = [];
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < req.body.extensions.length; ++i) {
      const ext = req.body.extensions[i];
      extensions.push(new Extension(ext.name, ext.commit, ext.type, ext.repository));
  }
  const task = new Task(extensions);
  tasks[task.getToken()] = task;
  res.end(task.getToken());
});

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
