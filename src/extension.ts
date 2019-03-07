import * as fs from "fs-extra";
import * as status from "http-status";
import * as https from "https";
import removeMd = require("remove-markdown");
import * as exampleExtensions from "./exampleExtension";

export enum ExtensionType {
    FRONTEND,
    BACKEND
}

export class Extension {
    public desc: string;
    public extensionType: ExtensionType;
    public imgUrl: string;
    public incompatibleExtensions: string[];
    public name: string;
    public repository: string;
    public requiredExtensions: string[];
    public version: string;
    constructor(name?: string, version?: string, type?: ExtensionType, repository?: string) {
        this.name = name;
        this.version = version;
        this.extensionType = type;
        this.repository = repository;
    }
}

interface ExtensionJSONObject {
    imgUrl: string;
    incompatibleExtensions: string[];
    requiredExtensions: string[];
}

const defaultImgUrl = "img/logo-default.png";
const defaultDescr = "This is an extension for ExplorViz.";
const defaultBranch = "build-service-test";

const backendInitializer = {name: "explorviz-backend",
    repository: "https://github.com/ExplorViz/explorviz-backend"
};
const frontendInitializer = {name: "explorviz-frontend",
    repository: "https://github.com/ExplorViz/explorviz-frontend"
};

function addDummyExtensions(extensions) {
    console.log("Adding dummies to extension list.");

    extensions.frontend.push(exampleExtensions.getMissingImageDummyFE());
    extensions.frontend.push(exampleExtensions.getNewVrDummyFE());
    extensions.backend.push(exampleExtensions.getMissingImageDummyBE());
    extensions.backend.push(exampleExtensions.getNewVrDummyBE());

    return extensions;
}

/**
 * Initiate automated update of the extensionList.json file.
 *
 * Use insertExampleValues boolean to include example values and dummy extensions.
 *
 * Don't use this function exessively as GitHub API requests are limited to 60/hour.
 * @param {boolean} insertExampleValues Defaults to false.
 */
export async function updateExtensionsJSON(insertExampleValues = false) {
    let tmpList = null;
    let returnStatus = "";
    try {
        tmpList = await getExtensionLists();
        tmpList.front.unshift(frontendInitializer);
        tmpList.back.unshift(backendInitializer);
    } catch (error) {
        console.log("Error assembling extension list: " + error);
        return;
    }
    console.log("List of extensions gathered.");
    try {
        const front = await combineExtensionInformation(tmpList.front, "frontend");
        const back = await combineExtensionInformation(tmpList.back, "backend");
        tmpList = {
            backend : back,
            frontend : front
        };
        if (insertExampleValues) {
            tmpList = addDummyExtensions(tmpList);
        }
        fs.writeJSONSync("extensionList.json", tmpList, {spaces:2});
        returnStatus = "Success! ";
    } catch (error) {
        console.log("Error: Failed to update the extensionList.json." + error.message);
        returnStatus = "Failure! ";
    }
    return returnStatus;
}

async function combineExtensionInformation(extensions, listName) {
    const updatedExtensions = [];
    for (let i = 0; i < extensions.length; i++) {
        let tmp = null;
        try {
            tmp = await getExtensionInformation(extensions[i]);
            tmp.desc = await getRepositoryDescription(extensions[i].name, defaultBranch);
        } catch (error) {
            console.log("Error processing " + extensions[i].name +
                `: Could not parse extension information (${error.message}). Using default values instead.`);
            tmp = getDefaultExtensionInformation(extensions[i], listName);
        }
        tmp.name = tmp.name.substring(10);
        console.log(i + ": " + tmp.name);
        updatedExtensions.push(tmp);
    }
    return updatedExtensions;
}

/**
 * Returns the current lists of frontend and backend extensions of ExplorViz
 * from GitHub as promise.
 */
function getExtensionLists() {
    const options = {
        headers: {
            "User-Agent": "ExplorViz-build-service",
        },
        hostname: "api.github.com",
        method: "GET",
        path: `/search/repositories?q=explorviz+extension+in:name+org:ExplorViz`,
        port: 443
    };
    let data = "";
    return new Promise((resolve, reject) => {
        const req = https.request(options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                return reject(new Error(resp.statusCode + " - " + status[resp.statusCode]));
            }
            resp.on("data", (d) => {
                data += d;
            });
            resp.on("end", () => {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    reject(e);
                }
                data = (data as any).items;
                const out = {
                    back : [],
                    front : []
                };
                // tslint:disable-next-line:prefer-for-of
                for (let i = 0; i < data.length; i++) {
                    const extension = data[i];
                    const name = (extension as any).name;
                    const temp: Extension = new Extension();
                    temp.name = name;
                    temp.repository = (extension as any).html_url;
                    temp.version = "1.0";
                    if (name.includes("frontend")) {
                        out.front.push(temp);
                    } else if (name.includes("backend")) {
                        out.back.push(temp);
                    }
                }
                resolve(out);
            });
        });
        req.on("error", (err) => {
            reject(err);
        });
        req.end();
    });
}

/**
 * Assembles the Extension information from different sources and creates a complete
 * extension object.
 * TODO: add descr & version; error handling
 * @param {Object()} extension
 */
function getExtensionInformation(extension: Extension) {
    return new Promise((resolve, reject) => {
        getExtensionJSON(extension.name, "build-service-test")
        .then((succ) => {
            try {
                const success: ExtensionJSONObject = JSON.parse(succ.toString());
                extension.requiredExtensions = success.requiredExtensions;
                extension.incompatibleExtensions = success.incompatibleExtensions;
                extension.imgUrl = success.imgUrl;
            } catch (error) {
                reject(error);
            }
            resolve(extension);
        }, (err) => {
            // console.log("Error processing: " + extension.name+ ": " + err.message);
            reject(err);
        });
    });
}

/**
 * Add default values to an Extension object.
 * @param {Object} extension
 * @param {String} target Either frontend or backend.
 */
function getDefaultExtensionInformation(extension, target) {
    extension.requiredExtensions = [target];
    extension.incompatibleExtensions = [];
    extension.imgUrl = defaultImgUrl;
    extension.desc = defaultDescr;
    return extension;
}

/**
 * Get the exttensions.json file from a certain branch of a repository.
 * @param {String} reponame
 * @param {String} branch
 */
function getExtensionJSON(reponame, branch) {
    const options = {
        headers: {
            "Accept": "application/vnd.github.raw+json",
            "User-Agent": "ExplorViz-build-service"
        },
        hostname: "api.github.com",
        method: "GET",
        path: `/repos/ExplorViz/${reponame}/contents/extensions.json?ref=${branch}`,
        port: 443
    };
    let data = "";
    return new Promise((resolve, reject) => {
        const req = https.request(options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                return reject(new Error(resp.statusCode + " - " + status[resp.statusCode]));
            }
            resp.on("data", (d) => {
                data += d;
            });
            resp.on("end", () => {
                resolve(data);
            });
        });
        req.on("error", (err) => {
            reject(err);
        });
        req.end();
    });
}

/**
 * Returns a promise for the project description of a certain branch of an ExplorViz
 * repository.
 * @param {String} reponame
 * @param {String} branch defaults to "master".
 */
export function getRepositoryDescription(reponame, branch = "master") {
    const options = {
        headers: {
            "Accept": "application/vnd.github.raw+json",
            "User-Agent": "ExplorViz-build-service"
        },
        hostname: "api.github.com",
        method: "GET",
        path: `/repos/ExplorViz/${reponame}/readme?ref=${branch}`,
        port: 443
    };
    let data = "";
    return new Promise((resolve, reject) => {
        const req = https.request(options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                return reject(new Error(resp.statusCode + " - " + status[resp.statusCode]));
            }
            resp.on("data", (d) => {
                data += d;
            });
            resp.on("end", () => {
                try {
                    let dataArr = data.split("## Project Description");
                    dataArr = dataArr[1].split("##");
                    data = dataArr[0].trim();
                    data = removeMd(data);
                } catch (e) {
                    reject(e);
                }
                resolve(data);
            });
        });
        req.on("error", (err) => {
            reject(err);
        });
        req.end();
    });
}
