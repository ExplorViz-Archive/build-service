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
        res.render("build");
    } else {
       res.status(404).send("Not found.");
    }
});

/**
 * Used by confirmation to finalize the configuration by user.
 */
ConfirmationRouter.post("/:id", (req, res) => {
    const builds = getBuilds()[req.params.id];
    startBuildTask(builds).then((token) => 
    {
        res.json(token);
    });
});
