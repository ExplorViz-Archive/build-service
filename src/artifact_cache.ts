import {existsSync} from "fs";
import {sha512_256} from "js-sha512";
import {getConfig} from "./config";
import {Extension} from "./extension";

const config = getConfig();

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
