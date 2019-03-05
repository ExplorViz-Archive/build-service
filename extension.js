module.exports = {
    getRepositoryDescription,
    updateExtensionsJSON
};

/**
 * Generate new dummy extensions
 */

const fs = require('fs');
const https = require('https');
const removeMd = require('remove-markdown'); 
const status = require('http-status');
const exampleExtensions = require('./exampleExtension.js')

const defaultImgUrl = "img/logo-default.png";
const defaultDescr = "This is an extension for ExplorViz.";
const defaultBranch = "build-service-test";

const backendInitializer = {name: "explorviz-backend", 
        url: "https://github.com/ExplorViz/explorviz-backend"
};
const frontendInitializer = {name: "explorviz-frontend", 
        url: "https://github.com/ExplorViz/explorviz-frontend"
};

/**
 * Initiate automated update of the extensionList.json file. 
 * 
 * Use insertExampleValues boolean to include example values and dummy extensions.
 * 
 * Don't use this function exessively as GitHub API requests are limited to 60/hour.
 * @param {boolean} insertExampleValues Defaults to false.
 */
async function updateExtensionsJSON(insertExampleValues = false){
    let tmpList = null;
    let status = "";
    try {
        tmpList = await getExtensionLists();
        tmpList.front.unshift(frontendInitializer);
        tmpList.back.unshift(backendInitializer);
    } catch (error) {
        console.log("Error assembling extension list: " + error);
        return
    }
    console.log("List of extensions gathered.");
    try {
        let front = await combineExtensionInformation(tmpList.front, "frontend");
        let back = await combineExtensionInformation(tmpList.back, "backend");
        if (insertExampleValues) {
            front.push(exampleExtensions.getMissingImageDummyFE());
            front.push(exampleExtensions.getNewVrDummyFE());
            back.push(exampleExtensions.getMissingImageDummyBE());
            back.push(exampleExtensions.getNewVrDummyBE());
        }
        tmpList = {
            frontend : front,
            backend : back
        }
        fs.writeFileSync('extensionList.json', JSON.stringify(tmpList, null, 2), function (err) {
            if(err !== null) {
                console.log(err);
            }
        });
        status = "Success! "
    } catch (error) {
        console.log("Error: Failed to update the extensionList.json." + error.message);    
        status = "Failure! "
    }    
    return status;
}

async function combineExtensionInformation(extensions, listName) {
    updatedExtensions = [];
    for (let i = 0; i < extensions.length; i++){
        let tmp = null;
        try {
            tmp = await getExtensionInformation(extensions[i]);
            tmp.desc = await getRepositoryDescription(extensions[i].name, defaultBranch);
        } catch (error) {
            console.log("Error processing " + extensions[i].name + 
                ": Could not parse extension information. Using default values instead.")
            tmp = getDefaultExtensionInformation(extensions[i], listName);
        }
        tmp.name = tmp.name.substring(10);
        console.log(i + ": " + tmp.name);
        updatedExtensions.push(tmp) 
    }
    return updatedExtensions;
}

/**
 * Returns the current lists of frontend and backend extensions of ExplorViz
 * from GitHub as promise.
 */
function getExtensionLists() {
    const options = {
        hostname: 'api.github.com',
        port: 443,
        path: `/search/repositories?q=explorviz+extension+in:name+org:ExplorViz`,
        headers: {
            'User-Agent': 'ExplorViz-build-service',
        },
        method: 'GET'
    };
    let data = '';
    return new Promise((resolve, reject) => {
        const req = https.request(options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                return reject(new Error(resp.statusCode + " - " + status[resp.statusCode]));
            }
            resp.on('data', (d) => {
                data += d;
            });
            resp.on('end', () => {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    reject(e);
                }
                data = data["items"];
                let out = {
                    front : [],
                    back : []
                }
                for (let i = 0; i < data.length; i++) {
                    let extension = data[i]
                    let name = extension.name;
                    let temp = new Object();
                    temp.name = name;
                    temp.url = extension.html_url;
                    temp.version = "1.0";
                    if (name.includes("frontend")) {
                        out.front.push(temp);
                    } else if (name.includes("backend")) {
                        out.back.push(temp);
                    }
                }
                data = out;
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
 * Assembles the Extension information from different sources and creates a complete 
 * extension object.
 * TODO: add descr & version; error handling
 * @param {Object()} extension 
 */
function getExtensionInformation(extension) {
    return new Promise((resolve, reject) => {
        getExtensionJSON(extension.name, "build-service-test")
        .then(succ => {
            try {
                succ = JSON.parse(succ.toString());
                extension.requiredExtensions = succ.requiredExtensions;
                extension.incompatibleExtensions = succ.incompatibleExtensions;
                extension.imgUrl = succ.imgUrl;
            } catch (error) {
                reject(error);
            }
            resolve(extension);
        }, err => {
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
function getDefaultExtensionInformation(extension, target){
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
        hostname: 'api.github.com',
        port: 443,
        path: `/repos/ExplorViz/${reponame}/contents/extensions.json?ref=${branch}`,
        headers: {
            'User-Agent': 'ExplorViz-build-service',
            Accept: 'application/vnd.github.raw+json'
        },
        method: 'GET'
    };
    let data = '';
    return new Promise((resolve, reject) => {
        const req = https.request(options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                return reject(new Error(resp.statusCode + " - " + status[resp.statusCode]));
            }
            resp.on('data', (d) => {
                data += d;
            });
            resp.on('end', () => {
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
function getRepositoryDescription(reponame, branch = "master") {
    const options = {
        hostname: 'api.github.com',
        port: 443,
        path: `/repos/ExplorViz/${reponame}/readme?ref=${branch}`,
        headers: {
            'User-Agent': 'ExplorViz-build-service',
            Accept: 'application/vnd.github.raw+json'
        },
        method: 'GET'
    };
    let data = '';
    return new Promise((resolve, reject) => {
        const req = https.request(options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                return reject(new Error(resp.statusCode + " - " + status[resp.statusCode]));
            }
            resp.on('data', (d) => {
                data += d;
            });
            resp.on('end', () => {
                try {
                    data = data.split("## Project Description");
                    data = data[1].split("##");
                    data = data[0].trim();
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