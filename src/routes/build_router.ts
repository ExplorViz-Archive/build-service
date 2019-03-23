import {Router} from "express";
import {configurationHash} from "../artifact_cache";
import {resolveCommit} from "../artifact_builder";
import {Extension, ExtensionType} from "../extension";

export const BuildRouter: Router = Router();
const builds: {[key: string]: Extension[]} = {};

/**
 * Used by configurator to register a new build.
 */
BuildRouter.post("/post", async (req, res) => {
    const temp: any[] = req.body.config;
    const configuration: Extension[] = [];

    for (const extension of temp) {
        let type: ExtensionType = null;

        if (extension.extensionType === "1") {
            type = ExtensionType.BACKEND;
        } else {
            type = ExtensionType.FRONTEND;
        }
        if (type === null) {
            continue;
        }
        const newExt = new Extension(
            extension.name,
            extension.version,
            type,
            extension.repository
        )
        console.log(newExt);
        configuration.push(newExt);
    }

    // Convert named versions to commit hashes.
    // this allows us to differentiate between
    // different versions on a branch (e.g. master)
    for(let i = 0; i < configuration.length; ++i)
    {
        configuration[i].commit = await resolveCommit(configuration[i]);
    }

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
