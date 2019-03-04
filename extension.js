module.exports = {
    getRepositoryDescription,
    assembleExampleExtensions,
    updateExtensionsJSON
};

/**
 * Generate new dummy extensions
 */

const fs = require('fs');
const https = require('https');
const removeMd = require('remove-markdown'); 
const status = require('http-status');

const defaultImgUrl = "img/logo-default.png";
const defaultDescr = "This is an extension for ExplorViz";
const defaultBranch = "build-service-test";

const backendInitializer = {name: "explorviz-backend", 
        url: "https://github.com/ExplorViz/explorviz-backend"
};
const frontendInitializer = {name: "explorviz-frontend", 
        url: "https://github.com/ExplorViz/explorviz-frontend"
};

async function updateExtensionsJSON(){
    let tmpList = null;
    try {
        tmpList = await getExtensionLists();
        tmpList.front.unshift(frontendInitializer);
        tmpList.back.unshift(backendInitializer);
    } catch (error) {
        console.log("Error assembling extension list: " + error);
        return
    }
    console.log("list assembled");
    frontend = [];
    for (let i = 0; i < tmpList.front.length; i++){
        let tmp = null;
        try {
            tmp = await getExtensionInformation(tmpList.front[i]);
            tmp.desc = await getRepositoryDescription(tmpList.front[i].name, defaultBranch);
            console.log(i);
        } catch (error) {
            console.log("Error processing " + tmpList.front[i].name + 
                ": Could not parse extensions extension information. Using default values instead.")
            tmp = getDefaultExtensionInformation(tmpList.front[i], "frontend");
            console.log(i + "*");
        }
        tmp.name = tmp.name.substring(10);
        console.log(tmp.name);
        frontend.push(tmp) 
    }
    backend = [];
    for (let i = 0; i < tmpList.back.length; i++){
        let tmp = null;
        try {
            tmp = await getExtensionInformation(tmpList.back[i]);
            tmp.desc = await getRepositoryDescription(tmpList.back[i].name, defaultBranch);
            console.log(i);
        } catch (error) {
            console.log("Error processing " + tmpList.back[i].name + 
                ": Could not parse extensions extension information. Using default values instead.")
            tmp = getDefaultExtensionInformation(tmpList.back[i], "backend");
            console.log(i + "*");
        }
        tmp.name = tmp.name.substring(10);
        console.log(tmp.name);
        backend.push(tmp);
    }
    
    tmpList = {
        frontend : frontend,
        backend : backend
    }

    fs.writeFileSync('extensionList.json', JSON.stringify(tmpList, null, 2), function (err) {
        if(err !== null) {
            console.log(err);
        }
    });

    console.log("Finished updating extensions.json.")
    return;
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
            console.log("Error processing: " + extension.name+ ": " + err.message);
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

/**
 * This is the constructor for data representation of relevant information for building and extension.
 * @param {String} name 
 * @param {String} desc 
 * @param {String} imgUrl 
 * @param {String[]} requiredExtensions 
 * @param {String[]} incompatibleExtensions 
 * @param {String} url 
 * @param {String} version 
 */
function Extension(name, desc, imgUrl, requiredExtensions, incompatibleExtensions, url, version) {
    this.name = name;
    this.desc = desc;
    this.imgUrl = imgUrl;
    this.requiredExtensions = requiredExtensions;
    this.incompatibleExtensions = incompatibleExtensions;
    this.url = url;
    this.version = version;
}

/**
 * Generates an example extension.json file with mostly dummy extensions.
 */
function assembleExampleExtensions() {
    const evDesc = "ExplorViz uses dynamic analysis techniques to provide live trace visualization of the communication in large software landscape. It targets system and program comprehension in those landscapes while still providing details on the communication within an application. A landscape perspective enriches current system visualizations with additional abstraction levels for efficient comprehension of communication between hundreds of applications which is often encountered in, for instance, Cloud environments. On the application level perspective, ExplorViz utilizes the 3D city metaphor combined with an interactive concept of showing only details that are in focus of the analysis. For best accessibility, ExplorViz is a web-based tool featuring cutting-edge technologies like WebGL and HTML 5.";
    const beDesc = "This extension adds features to the backend of ExplorViz to enable a multi-user VR-experience. The related frontend extension is explorviz-frontend-extension-vr.";
    const feDesc = "This extension adds a WebVR-based Virtual Reality (VR) mode to ExplorViz, which allows collaborative exploration.";
    const lorIp = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sed diam eget risus varius blandit sit amet non magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cras mattis consectetur purus sit amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Aenean lacinia bibendum nulla sed consectetur.";
    
    
    const ext1 = new Extension("backend-extension-vr", 
                                beDesc,
                                "img/vr.png", 
                                ["backend", "frontend", "frontend-extension-vr"], 
                                [],
                                "https://github.com/ExplorViz/explorviz-backend-extension-vr",
                                "1.0"
    );
    
    const ext3 = new Extension("backend-extension-new-vr", 
                                beDesc,
                                "img/vr.png", 
                                ["backend", "frontend", "frontend-extension-new-vr"], 
                                ["backend-extension-vr"],
                                "https://github.com/ExplorViz/explorviz-backend-extension-vr",
                                "1.1"
    );
    
    const ext5 = new Extension("backend", 
                                evDesc,
                                "img/logo-be.png", 
                                ["frontend"], 
                                [],
                                "https://github.com/ExplorViz/explorviz-backend",
                                "1.0"
    );
    
    const ext2 = new Extension("frontend-extension-vr", 
                                feDesc,
                                "img/vr.png", 
                                ["backend", "frontend", "backend-extension-vr"], 
                                [],
                                "https://github.com/ExplorViz/explorviz-frontend-extension-vr",
                                "1.0"
    );  
    const ext4 = new Extension("frontend-extension-new-vr", 
                                feDesc, 
                                "img/vr.png",
                                ["backend", "frontend", "backend-extension-new-vr"], 
                                ["frontend-extension-vr"],
                                "https://github.com/ExplorViz/explorviz-frontend-extension-vr",
                                "1.1"
    );
    
    const ext6 = new Extension("frontend", 
                                evDesc, 
                                "img/logo-fe.png",
                                ["backend"], 
                                [],
                                "https://github.com/ExplorViz/explorviz-frontend",
                                "1.0"
    );
    
    const ext7 = new Extension("backend-missing-image-dummy", 
                                lorIp, 
                                "",
                                ["backend"], 
                                [],
                                "https://www.google.com",
                                "1.0"
    );
    
    const ext8 = new Extension("frontend-missing-image-dummy", 
                                lorIp, 
                                "",
                                ["frontend"], 
                                [],
                                "https://www.google.com",
                                "1.0"
    );
    
    var front = [];
    var back = [];
    
    back.push(ext5);
    front.push(ext6);
    back.push(ext1);
    front.push(ext2);
    back.push(ext3);
    front.push(ext4);
    
    for (let i = 0; i<8; i++) {
        let fd = new Extension("frontend-extension-dummy" + i,
        lorIp+lorIp+lorIp+lorIp,
        "img/logo-fe.png",
        ["frontend"],
        [],
        "https://www.google.com",
        "1.0"
        );
        let bd = new Extension("backend-extension-dummy" + i,
        lorIp,
        "img/logo-be.png",
        ["backend"],
        [],
        "https://www.google.com",
        "1.0"
        );  
        front.push(fd)
        back.push(bd)
    }
    
    back.push(ext7);
    front.push(ext8);
    
    var newJson = {
        frontend : front,
        backend: back
    };
    
    fs.writeFileSync('extensions.json', JSON.stringify(newJson, null, 2), function (err) {
        if(err !== null) {
            console.log(err);
        }
    });
    
    console.log(`Generated ${front.length} frontend and ${back.length} backend extensions.`)
}