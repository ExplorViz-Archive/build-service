import {Extension, ExtensionType} from "./extension"
import {Config} from "./config"
const config: Config = require('../config.json');
import * as fs from "async-file"
import {sha512} from "js-sha512"


export async function moveToCache(path: string, extensions: Array<Extension>)
{
    await fs.rename(path, await getFile(extensions));
}

export async function isCached(extensions: Array<Extension>)
{
    return await fs.exists(await getFile(extensions));
}

export async function getFile(extensions: Array<Extension>)
{
    const hash = configurationHash(extensions);
    return config.cachePath + "/" + hash + ".zip";
}

function configurationHash(extensions: Array<Extension>)
{
    extensions.sort((a, b) => a.name.localeCompare(b.name));
    let hash = sha512.create();
    extensions.forEach(element => {
        sha512.update(element.name);
        sha512.update(element.version);
    });
    return hash.hex();
}