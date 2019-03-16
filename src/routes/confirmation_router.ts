import {Router} from "express";
import {Extension} from "../extension";
import {startBuildTask} from "./artifact_router";
import {getBuilds} from "./build_router";

export const ConfirmationRouter: Router = Router();

/**
 * Used by confirmation to load the page.
 */
ConfirmationRouter.get("/:id", (req, res) => {
    const conf = getBuilds()[req.params.id];
    if (conf !== null) {
        res.render("confirmation");
    } else {
        res.end("NaN");
    }
});

/**
 * Used by confirmation to finalize the configuration by user.
 * TODO: link to build process
 */
ConfirmationRouter.post("/:id", (req, res) => {
    const builds = getBuilds()[req.params.id];
    const exts: Extension[] = [] ;
    for (const key in builds) {
        exts.push(builds[key]);
    }
    const token = startBuildTask(exts);
    res.json(token);
    // const config = {
    //     conf:  getBuilds()[req.params.id],
    //     deployment: req.body.deployment
    //   };
    // res.json(config);
});
