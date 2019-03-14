import * as fs from "async-file";
import * as fse from "fs-extra";
import * as child_process from "ts-process-promises";
import {configurationHash, getFile, isCached, moveToCache} from "./artifact_cache";
import {Config, createDefaultConfig} from "./config";
import {Extension, ExtensionType} from "./extension";
import {Task} from "./task";

let config: Config;
try {
  config = fse.readJsonSync("config.json");
} catch (error) {
  console.log("No config.json found. Generating new file.");
  config = createDefaultConfig();
  fse.writeJSONSync("config.json", config, {spaces: 2});
}
const activeBuilding = {};

export function getConfiguration(task: Task, extensions: Extension[]): [string, Promise<string>] {
    const hash = configurationHash(extensions);
    if (activeBuilding[hash] !== undefined) {
        // Currently compiling, return existing promise 
       return [hash, activeBuilding[hash]];
    }

    if (isCached(extensions)) {
       // Return from cache
       return [hash, Promise.resolve(getFile(extensions))];
    }

    // Not cached, needs building
    const promise = buildConfiguration(task, extensions);

    activeBuilding[hash] = promise;
    return [hash, promise.then(() => {
        activeBuilding[hash] = undefined;
        return getFile(extensions);
    })];
}

export async function buildConfiguration(task: Task, extensions: Extension[]) {
    /* An explorviz archive contains:
        - The explorviz frontend including extensions
        - The explorviz backend
        - Explorviz backend extensions
        - A startup script
        - A readme file
    */
    const path = config.tmppath + "/dir";
    task.setStatus("frontend");
    // Build the ember js based frontend, this is unique per configuration
    await buildFrontend(path, extensions);

    task.setStatus("backend");
    // Fetch backend including extensions
    await buildBackend(path, extensions);

    task.setStatus("static");
    // Fetch static files (Readme, startup Script)
    // todo

    task.setStatus("compress");
    // Compress
    await buildArchive(path);

    task.setStatus("cache");
    // Write to cache
    await moveToCache(path, extensions);

    task.setStatus("cleanup");
    // Remove build files
    await fs.delete(path);
    task.setStatus("done");
}

async function buildArchive(path: string) {
    // todo
}

/**
 * Builds an explorviz frontend with a set of installed extensions
 * @param extensions Extensions to install
 */
async function buildFrontend(targetdir: string, extensions: Extension[]) {
    // TODO: Cache this
    // TODO: Use specific version (release)
    await child_process.exec("git clone " + config.frontendrepo, { cwd: config.tmppath });

    const repoPath = config.tmppath + "/explorviz-frontend";

    // Install frontend dependencies
    await child_process.exec("npm install", { cwd: repoPath });

    // Install extensions
    extensions.forEach(async (extension) => {
        if (extension.extensionType !== ExtensionType.FRONTEND) {
            return;
        }

        // TODO: Use specific version
        await child_process.exec("ember install " + extension.repository, { cwd: repoPath });
    });

    // Build the frontend
    await child_process.exec("ember build --environment production", { cwd: repoPath});

    // Move the frontend to the target directory
    await fs.rename(repoPath + "/dist", targetdir);

    // Cleanup
    await fs.delete(repoPath);
}

/**
 * Builds an explorviz backend with a set of installed extensions
 * @param extensions Extensions to install
 */
async function buildBackend(targetdir: string, extensions: Extension[]) {
    // TODO: Cache this
    // TODO: Use specific version (release)
    await child_process.exec("git clone " + config.backendrepo, { cwd: config.tmppath });

    const repoPath = config.tmppath + "/explorviz-backend";

    // Build
    await child_process.exec("gradle build", { cwd: repoPath });

    // Move the backend to the target directory
    await fs.rename(repoPath + "/build/libs/explorviz-backend-deployment.war", targetdir
        + "/explorviz-backend-deployment.war");

    // Build extensions
    extensions.forEach(async (extension) => {
        buildBackendExtension(targetdir, extension);
    });

    // Cleanup
    await fs.delete(repoPath);
}

async function buildBackendExtension(targetdir: string, extension: Extension) {
    if (extension.extensionType !== ExtensionType.BACKEND) {
        return;
    }

    await child_process.exec("git clone " + extension.repository, { cwd: config.tmppath });
    await child_process.exec("gradle build", { cwd: config.tmppath + "/" + extension.name});
    // todo: how to find the .war file?
}
