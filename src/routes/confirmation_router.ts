import {Router} from "express";
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
    const config = {
      conf:  getBuilds()[req.params.id],
      deployment: req.body.deployment
    };
    res.json(config);
});
