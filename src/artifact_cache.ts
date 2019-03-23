import * as fs from "async-file";
import {existsSync} from "fs";
import * as fse from "fs-extra";
import {sha512, sha512_256} from "js-sha512";
import {Config, createDefaultConfig} from "./config";
import {Extension, ExtensionType} from "./extension";

let config: Config;
try {
  config = fse.readJsonSync("config.json");
} catch (error) {
  console.log("No config.json found. Generating new file.");
  config = createDefaultConfig();
  fse.writeJSONSync("config.json", config, {spaces: 2});
}

export function getCachePath(extensions: Extension[]) {
    return getFile(extensions);
}

export function isCached(extensions: Extension[]) {
    const path = getFile(extensions);
    return existsSync(path);
}

export function getFile(extensions: Extension[]) {
    const hash = configurationHash(extensions);
    return config.cachePath + "/" + hash + ".zip";
}

export function configurationHash(extensions: Extension[]) {
    const extensionsArr = Array.from(extensions);
    extensionsArr.sort((a, b) => a.name.localeCompare(b.name));
    const hash = sha512_256.create();
    for (const extension of extensionsArr) {
        hash.update(extension.name);
        hash.update(extension.commit);
    }
    return hash.hex();
}
