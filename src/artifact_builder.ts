import * as fs from "async-file";
import * as fse from "fs-extra";
import * as path from "path";
import * as archiver from "archiver-promise";
import * as child_process from "ts-process-promises";
import {isCached, getCachePath} from "./artifact_cache";
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
    await fs.mkdirp(path + "/out");
    await fs.mkdirp(path + "/out/frontend");
    await fs.mkdirp(path + "/build");

    task.setStatus(TaskState.FRONTEND);
    // Build the ember js based frontend, this is unique per configuration
    await buildFrontend(path, task.extensions);

    task.setStatus(TaskState.BACKEND);
    // Fetch backend including extensions
    await buildBackend(path, task.extensions);

    task.setStatus(TaskState.PACKING);
    // Compress to cache
    await buildArchive(path, task.extensions);
    // Remove build files
    await fs.delete(path);
}


/***
 * Resolves the commit hash for an extension + version combination
 * This is primarily useful for branches like master, as master will point
 * to different commits over time
*/
export async function resolveCommit(ext: Extension)
{
    const execResults = await child_process.exec("git ls-remote " + ext.repository + " " + ext.version);
    return execResults.stdout.split("\t")[0];
}

async function buildArchive(path: string, extensions : Extension[]) {
    const archive = archiver.default(getCachePath(extensions), {
        store: true
    });

    archive.directory(path + "/out", false)
    // Add static files (Readme, startup Script)
    // todo
    return archive.finalize();
}

/**
 * Builds an explorviz frontend with a set of installed extensions
 * @param extensions Extensions to install
 */
async function buildFrontend(targetdir: string, extensions: Extension[]) {
    const frontend = extensions.find(c => c.isBase && c.extensionType == ExtensionType.FRONTEND);
    await child_process.exec("git clone -b '" + frontend.version + "' --depth 1 " + frontend.repository, { cwd: targetdir + "/build/" });

    const repoPath = targetdir + "/build/explorviz-frontend";

    // Install frontend dependencies
    await child_process.exec("npm install", { cwd: repoPath });

    // Install extensions
    await asyncForEach(extensions, async (extension) => {
        if (extension.extensionType !== ExtensionType.FRONTEND || extension.isBase()) {
            return;
        }

        // TODO: Use specific version
        await child_process.exec("ember install " + extension.repository, { cwd: repoPath });
    });

    // Build the frontend
    await child_process.exec("ember build --environment production", { cwd: repoPath});

    // Move the frontend to the target directory
    await fs.rename(repoPath + "/dist", targetdir + "/out/frontend");

    // Cleanup
    await fs.delete(repoPath);
}

/**
 * Builds an explorviz backend with a set of installed extensions
 * @param extensions Extensions to install
 */
async function buildBackend(targetdir: string, extensions: Extension[]) {
    const backend = extensions.find(c => c.isBase && c.extensionType == ExtensionType.BACKEND);
    await child_process.exec("git clone -b '" + backend.version + "' --depth 1 " + backend.repository, { cwd: targetdir + "/build/" });

    const repoPath = targetdir + "/build/explorviz-backend";

    // Build
    await child_process.exec("./gradlew assemble", { cwd: repoPath });

    // Get all .jar files
    const files = await fs.readdir(repoPath + "/build/libs")
    await asyncForEach(files, async element => {
        if(path.extname(element) === ".jar")
            await fs.rename(repoPath + "/build/libs/" + element, targetdir + "/out/" + path.basename(element));
    });

    // Build extensions
    await asyncForEach(extensions, async (extension) => {
        await buildBackendExtension(targetdir, extension);
    });

    // Cleanup
    await fs.delete(repoPath);
}

async function buildBackendExtension(targetdir: string, extension: Extension) {
    if (extension.extensionType !== ExtensionType.BACKEND) {
        return;
    }

    const repoPath = targetdir + "/build/" + extension.name;
    await child_process.exec("git clone -b '" + extension.version + "' --depth 1 " + extension.repository, { cwd: targetdir + "/build/" });
    await child_process.exec("./gradlew assemble", { cwd: repoPath });
    const files = await fs.readdir(repoPath + "/build/libs")
    await asyncForEach(files, async element => {
        if(path.extname(element) === ".jar")
            await fs.rename(repoPath + "/build/libs/" + element, targetdir + "/out/" + path.basename(element));
    });

}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }