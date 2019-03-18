import * as fs from "async-file";
import * as fse from "fs-extra";
import * as child_process from "ts-process-promises";
import {configurationHash, getFile, isCached, moveToCache} from "./artifact_cache";
import {Config, createDefaultConfig} from "./config";
import {Extension, ExtensionType} from "./extension";
import {Task, TaskState} from "./task";

let config: Config;
try {
  config = fse.readJsonSync("config.json");
} catch (error) {
  console.log("No config.json found. Generating new file.");
  config = createDefaultConfig();
  fse.writeJSONSync("config.json", config, {spaces: 2});
}

export function getConfiguration(task: Task): Promise<void> {
    if (isCached(task.extensions)) {
       // Return from cache
       return Promise.resolve();
    }

    // Not cached, needs building
    return buildConfiguration(task);
}

async function buildConfiguration(task: Task) {
    /* An explorviz archive contains:
        - The explorviz frontend including extensions
        - The explorviz backend
        - Explorviz backend extensions
        - A startup script
        - A readme file
    */
    const path = config.tmppath + "/" + task.getToken();
    await fs.mkdirp(path);

    task.setStatus(TaskState.FRONTEND);
    // Build the ember js based frontend, this is unique per configuration
    await buildFrontend(path, task.extensions);

    task.setStatus(TaskState.BACKEND);
    // Fetch backend including extensions
    await buildBackend(path, task.extensions);

    task.setStatus(TaskState.PACKING);
    // Fetch static files (Readme, startup Script)
    // todo

    // Compress
    await buildArchive(path);
    // Write to cache
    await moveToCache(path, task.extensions);
    // Remove build files
    await fs.delete(path);
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
    await child_process.exec("git clone " + config.frontendrepo, { cwd: targetdir + "/build/" });

    const repoPath = targetdir + "/build/explorviz-frontend";

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
    await fs.rename(repoPath + "/dist", targetdir + "/out/");

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
    await child_process.exec("git clone " + config.backendrepo, { cwd: targetdir + "/build/" });

    const repoPath = targetdir + "/build/explorviz-backend";

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

    await child_process.exec("git clone " + extension.repository, { cwd: targetdir + "/build/" });
    await child_process.exec("gradle build", { cwd: targetdir + "/build/" + extension.name});
    // todo: how to find the .war file?
}
