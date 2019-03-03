/**
 * Generate new dummy extensions
 */

const fs = require('fs');
const https = require('https');
const removeMd = require('remove-markdown'); 
const status = require('http-status');

module.exports = {
    getRepositoryDescription,
    assembleExampleExtensions
};

function Extension(name, desc, imgUrl, requiredExtensions, incompatibleExtensions, url, version) {
    this.name = name;
    this.desc = desc;
    this.imgUrl = imgUrl;
    this.requiredExtensions = requiredExtensions;
    this.incompatibleExtensions = incompatibleExtensions;
    this.url = url;
    this.version = version;
}



function getRepositoryDescription(reponame, branch) {
    
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
    
    /*
    const file = fs.readFileSync('extensions.json');
    const json = JSON.parse(file);
    console.log(json["extensions"][1]);
    */
    
    console.log(`Generated ${front.length} frontend and ${back.length} backend extensions.`)
}