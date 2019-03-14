import {Router} from "express";
import {configurationHash} from "../artifact_cache";
import {Extension} from "../extension";

export const BuildRouter: Router = Router();
const builds: {[key: string]: Extension[]} = {};

/**
 * Used by configurator to register a new build.
 */
BuildRouter.post("/post", (req, res) => {
    const configuration: Extension[] = req.body.config;
    const hash = configurationHash(configuration);
    builds[hash] = configuration;
    res.end(hash);
});

/**
 * Used by confirmation page to request a build.
 */
BuildRouter.get("/get/:id", (req, res) => {
    const build = builds[req.params.id];
    if (build !== null) {
        res.send(build);
    } else {
        res.send("NaN");
    }
});

export function getBuilds() {
    return builds;
}
