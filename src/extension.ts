import * as fs from "fs-extra";
import status from "http-status";
import * as https from "https";
import * as path from "path";
import removeMd from "remove-markdown";
import {TOKEN} from "./auth";
import * as exampleExtensions from "./exampleExtension";

export enum ExtensionType {
    FRONTEND,
    BACKEND
}

export class Extension implements exampleExtensions.ExtensionObject {
    public id: string;
    public desc: string;
    public extensionType: ExtensionType;
    public imgSrc: string;
    public incompatibleExtensions: string[];
    public name: string;
    public repository: string;
    public requiredExtensions: string[];
    public version: string;
    public isBase: boolean;
    public commit: string;
    constructor(name: string, version: string, type: ExtensionType, repository: string) {
        this.name = name;
        this.extensionType = type;
        this.version = version;
        this.repository = repository;
        this.isBase = (name === "frontend" || name === "backend");
        this.commit = this.version;
        this.id = name + "_" + version;
        this.desc = defaultDescr;
        this.imgSrc = defaultimgSrc;
        this.requiredExtensions = ["frontend_master", "backend_master"];
        this.incompatibleExtensions = []
    }
}

interface ExtensionJSONObject {
    imgSrc: string;
    incompatibleExtensions: string[];
    requiredExtensions: string[];
}

export interface ExtensionLists {
    backend: Extension[];
    frontend: Extension[];
}

export const defaultimgSrc = "logo-default.png";
export const defaultDescr = "This is an extension for ExplorViz. "
    + "ATTENTION: This is a default description. "
    + "Therefore the information about required and incompatible extensions might not be complete. "
    + "Please check the link below for further information.";

/**
 * The default branch to use when looking for master branch extensions.
 * TODO: remove upon release
 */
export const defaultBranch = "build-service-test";

const backendInitializer: Extension = new Extension("explorviz-backend",
    "master",
    ExtensionType.BACKEND,
    "https://github.com/ExplorViz/explorviz-backend"
);
const frontendInitializer: Extension = new Extension("explorviz-frontend",
    "master",
    ExtensionType.FRONTEND,
    "https://github.com/ExplorViz/explorviz-frontend"
);

/**
 * Initiate automated update of the extensionList.json file.
 *
 * Use insertExampleValues boolean to include example values and dummy extensions.
 *
 * Don't use this function exessively as GitHub API requests are limited to 60/hour.
 * @param insertExampleValues Defaults to false.
 */
export async function updateExtensionsJSON(insertExampleValues: boolean = false) {
    let tmpList: ExtensionLists = null;
    let returnStatus = "";
    try {
        tmpList = await getExtensionLists();
        tmpList.frontend.unshift(frontendInitializer);
        tmpList.backend.unshift(backendInitializer);
    } catch (error) {
        console.log("Error: Failed to assemble extension list: " + error);
        returnStatus = error + " ";
        return;
    }
    console.log("List of extensions assembled.");
    // Check for release repositories.
    try {
        tmpList.backend = await addReleaseRepositories(tmpList.backend);
        tmpList.frontend = await addReleaseRepositories(tmpList.frontend);
        console.log("Release Repositories added.");
    } catch (error) {
        console.log("Could not add the release repositories to the extension lists. " + error.message);
    }
    // Add dev-1 branch for frontend and backend
    tmpList.frontend.push(getBranch(frontendInitializer, "dev-1"));
    tmpList.backend.push(getBranch(backendInitializer, "dev-1"));
    // Gather and combine the remaining information.
    try {
        const frontend = await combineExtensionInformation(tmpList.frontend);
        const backend = await combineExtensionInformation(tmpList.backend);
        tmpList.backend = backend;
        tmpList.frontend = frontend;
        if (insertExampleValues) {
            tmpList = addDummyExtensions(tmpList);
        }
        tmpList = updateBaseFields(tmpList);
        fs.writeJSONSync(path.join(__dirname, "extensionList.json"), tmpList, {spaces: 2});
        returnStatus = "Success! ";
    } catch (error) {
        console.log("Error: Failed to update the extensionList.json." + error.message);
        returnStatus = "Failure! ";
    }
    return returnStatus;
}

/**
 * Adds dummy extensions for testing purposes to the extension list.
 * @param extensions
 */
function addDummyExtensions(extensions: ExtensionLists) {
    console.log("Adding dummies to extension list.");
    extensions.frontend.push(exampleExtensions.getMissingImageDummyFE());
    extensions.frontend.push(exampleExtensions.getNewVrDummyFE());
    extensions.backend.push(exampleExtensions.getMissingImageDummyBE());
    extensions.backend.push(exampleExtensions.getNewVrDummyBE());
    return extensions;
}

/**
 * Update required extensions of all frontend and backend extensions such that
 * they always require the other part of the same version.
 * @param extensions 
 */
export function updateBaseFields(extensions: ExtensionLists) {
    for (const extension of extensions.backend) {
        if (extension.name === "backend") {
            extension.requiredExtensions = ["frontend_" + extension.version];
            extension.isBase = true;
        }
    }
    for (const extension of extensions.frontend) {
        if (extension.name === "frontend") {
            extension.requiredExtensions = ["backend_" + extension.version];
            extension.isBase = true;
        }
    }
    return extensions;
}


/**
 * Receives a list of either frontend or backend extensions and returns a list with all
 * combined information for every extension.
 *
 * @param extensions
 * @param extensionType
 */
export async function combineExtensionInformation(extensions: Extension[]) {
    const updatedExtensions: Extension[] = [];
    for (const extension of extensions) {
        let tmp = extension;
        try {
            tmp = await getExtensionInformation(extension);
        } catch (error) {
            console.log(`WARNING: ${extension.name.substring(10)}_${extension.version}: `
                + `Error while retrieving extension information `
                + `(${error.message}). Using default values instead.`);
        }
        try {
            tmp.desc = await getRepositoryDescription(extension.name, extension.version);
        } catch (error) {
            console.log(`WARNING: ${extension.name.substring(10)}_${extension.version}: `
                + `Error while retrieving extension description `
                + `(${error.message}). Using default values instead.`);
        }
        tmp.name = tmp.name.replace("explorviz-", "");
        tmp.id = tmp.name + "_" + tmp.version;
        updatedExtensions.push(tmp);
    }
    return updatedExtensions;
}

/**
 * Tries to return the current lists of frontend and backend extensions of ExplorViz
 * from GitHub.
 */
export function getExtensionLists(): Promise<ExtensionLists> {
    const options = {
        headers: {
            "Authorization": `token ${TOKEN}`,
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
                const out: ExtensionLists = {
                    backend : [],
                    frontend : []
                };
                // tslint:disable-next-line:prefer-for-of
                for (let i = 0; i < data.length; i++) {
                    const extension = data[i];
                    const name = (extension as any).name;
                    if (name.includes("frontend")) {
                        out.frontend.push(new Extension(name,
                            "master",
                            ExtensionType.FRONTEND,
                            (extension as any).html_url));
                    } else if (name.includes("backend")) {
                        out.backend.push(new Extension(name,
                            "master",
                            ExtensionType.BACKEND,
                            (extension as any).html_url));
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
 * Adds the information contained in the extension.json file from the respective
 * GitHub repository to the extension.
 * @param extension
 */
function getExtensionInformation(extension: Extension): Promise<Extension> {
    return new Promise((resolve, reject) => {
        const branch = (extension.version === "master") ? defaultBranch : extension.version;
        getExtensionJSON(extension.name, branch)
        .then((succ) => {
            try {
                const success: ExtensionJSONObject = succ;
                extension.requiredExtensions = success.requiredExtensions;
                extension.incompatibleExtensions = success.incompatibleExtensions;
                extension.imgSrc = success.imgSrc;
            } catch (error) {
                reject(error);
            }
            resolve(extension);
        }, (err) => {
            reject(err);
        });
    });
}

/**
  * Take the frontend or backend initializer and return the branch initializer.
  * @param initializer 
  * @param branch 
  */
function getBranch (initializer: Extension, branch: string): Extension {
    return new Extension(
        initializer.name,
        branch,
        initializer.extensionType,
        initializer.repository
    )
}

/**
 * Get the exttensions.json file from a certain branch of a repository.
 * @param reponame
 * @param branch
 */
export function getExtensionJSON(reponame: string, branch: string): Promise<ExtensionJSONObject> {
    const options = {
        headers: {
            "Accept": "application/vnd.github.raw+json",
            "Authorization": `token ${TOKEN}`,
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
                return reject(new Error("Extensions.json not found. "
                    + resp.statusCode + " - " + status[resp.statusCode]));
            }
            resp.on("data", (d) => {
                data += d;
            });
            resp.on("end", () => {
                resolve(JSON.parse(data));
            });
        });
        req.on("error", (err) => {
            reject(err);
        });
        req.end();
    });
}

/**
 * Depending on a given list of master repositories this function adds all
 * release versions to the lists and updates their version and repository url.
 * @param oldExtensions
 */
export async function addReleaseRepositories(oldExtensions: Extension[]) {
    const newExtensions: Extension[] = [];

    for (const extension of oldExtensions) {
        newExtensions.push(extension);
        let releases: ArrayLike<any> = [];
        try {
            releases = await getExtensionReleases(extension.name);
        } catch (error) {
            console.log(`Could not retrieve releases for ${extension.name}. ${error.message}`);
        }
        const releasesArr = Array.from(releases);
        for (const release of releasesArr) {
            newExtensions.push(new Extension(
                extension.name,
                release.tag_name,
                extension.extensionType,
                extension.repository
            ));
        }
    }
    return newExtensions;
}

/**
 * Retrieve the releases for am extension.
 */
export function getExtensionReleases(reponame: string): Promise<ArrayLike<any>> {
    const options = {
        headers: {
            "Authorization": `token ${TOKEN}`,
            "User-Agent": "ExplorViz-build-service"
        },
        hostname: "api.github.com",
        method: "GET",
        path: `/repos/ExplorViz/${reponame}/releases`,
        port: 443
    };
    let data = "";
    return new Promise((resolve, reject) => {
        const req = https.request(options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                return reject(new Error(`${options.path} not found. `
                    + ` ${resp.statusCode} - ${status[resp.statusCode]}`));
            }
            resp.on("data", (d) => {
                data += d;
            });
            resp.on("end", () => {
                resolve(JSON.parse(data));
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
 * @param reponame
 * @param branch defaults to "master".
 */
export function getRepositoryDescription(reponame: string, branch: string = "master"): Promise<string> {
    const version = (branch === "master") ? defaultBranch : branch;
    const options = {
        headers: {
            "Accept": "application/vnd.github.raw+json",
            "Authorization": `token ${TOKEN}`,
            "User-Agent": "ExplorViz-build-service"
        },
        hostname: "api.github.com",
        method: "GET",
        path: `/repos/ExplorViz/${reponame}/readme?ref=${version}`,
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