import {Router} from "express";
import {Extension, ExtensionType} from "../extension";
import {startBuildTask} from "./artifact_router";
import {getBuilds} from "./build_router";

export const ConfirmationRouter: Router = Router();

/**
 * Used by confirmation to load the page.
 */
ConfirmationRouter.get("/:id", (req, res) => {
    const conf = getBuilds()[req.params.id];
    if (conf !== null && typeof conf !== "undefined") {
        res.render("confirmation");
    } else {
       res.status(404).send("Not found.");
    }
});

/**
 * Used by confirmation to finalize the configuration by user.
 */
ConfirmationRouter.post("/:id", (req, res) => {
    const builds = getBuilds()[req.params.id];
    const exts: Extension[] = [] ;
    /*
    for (const key in builds) {
        exts.push(builds[key]);
    }*/
    exts.push(new Extension("explorviz-frontend-extension-vr", "dev-1", ExtensionType.FRONTEND, "https://github.com/ExplorViz/explorviz-frontend-extension-vr"))
    exts.push(new Extension("explorviz-backend-extension-vr", "dev-1", ExtensionType.BACKEND, "https://github.com/ExplorViz/explorviz-backend-extension-vr"))
    const token = startBuildTask(exts);
    res.json(token);
    // const config = {
    //     conf:  getBuilds()[req.params.id],
    //     deployment: req.body.deployment
    //   };
    // res.json(config);
});
