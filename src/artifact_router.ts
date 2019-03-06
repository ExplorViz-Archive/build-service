import { Router, Request, Response } from 'express';

import { Extension, ExtensionType } from './extension';
import { Task } from './task';
import {getConfiguration} from './artifact_builder'

const router: Router = Router();

let tasks : { [_ : string] : Task;} = {};
router.post("/",function(req,res){
  let extensions: Array<Extension> = [];
  for(let i = 0; i < req.body.extensions.length; ++i)
  {
      const ext = req.body.extensions[i];
      extensions.push(new Extension(ext.name, ext.commit, ext.type, ext.repository));
  }
  const task = new Task(extensions);
  tasks[task.getToken()] = task;
  res.end(task.getToken());
});

router.get("/status/:token", (req, res) => 
{
  let { token } = req.params;
  const task = tasks[token];
  if(task === undefined)
      res.end("notfound");
  else 
      res.end(task.getStatus());
});

router.get("/download/:token", (req, res) => 
{
    let { token } = req.params;
    const task = tasks[token];
    if(task === undefined)
        res.end("notfound");
    res.end(task.getDownload());
});

export const ArtifactRouter: Router = router;