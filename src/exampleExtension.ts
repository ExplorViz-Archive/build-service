
/**
 * Generate new dummy extensions
 */
import * as fs from "fs-extra";

const evDesc = "ExplorViz uses dynamic analysis techniques to provide live"
+ "trace visualization of the communication in large software landscape. It targets"
+ " system and program comprehension in those landscapes while still providing details"
+ " on the communication within an application. A landscape perspective enriches current"
+ "system visualizations with additional abstraction levels for efficient comprehension"
+ " of communication between hundreds of applications which is often encountered in, for"
+ " instance, Cloud environments. On the application level perspective, ExplorViz utilizes"
+ " the 3D city metaphor combined with an interactive concept of showing only details that"
+ " are in focus of the analysis. For best accessibility, ExplorViz is a web-based tool"
+ " featuring cutting-edge technologies like WebGL and HTML 5.";
const beDesc = "This extension adds features to the backend of ExplorViz to enable a"
+ " multi-user VR-experience. The related frontend extension is explorviz-frontend-extension-vr.";
const feDesc = "This extension adds a WebVR-based Virtual Reality (VR) mode to ExplorViz, which"
+ " allows collaborative exploration.";
const lorIp = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sed diam eget"
+ " risus varius blandit sit amet non magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit."
+ " Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cras mattis consectetur purus"
+ " sit amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia"
+ " odio sem nec elit. Aenean lacinia bibendum nulla sed consectetur.";

export interface ExtensionObject {
    desc: string;
    extensionType: ExtensionType;
    imgUrl: string;
    incompatibleExtensions: string[];
    name: string;
    repository: string;
    requiredExtensions: string[];
    version: string;
}

class ExampleExtension implements ExtensionObject {
    public desc: string;
    public imgUrl: string;
    public incompatibleExtensions: string[];
    public name: string;
    public requiredExtensions: string[];
    public repository: string;
    public version: string;
    public extensionType: ExtensionType;

    constructor(name: string,
                desc: string,
                imgUrl: string,
                extensionType: ExtensionType,
                requiredExtensions: string[],
                incompatibleExtensions: string[],
                repository: string,
                version: string) {
        this.name = name;
        this.desc = desc;
        this.imgUrl = imgUrl;
        this.requiredExtensions = requiredExtensions;
        this.incompatibleExtensions = incompatibleExtensions;
        this.repository = repository;
        this.version = version;
        this.extensionType = extensionType;
    }
}

enum ExtensionType {
    FRONTEND,
    BACKEND
}

export function getMissingImageDummyBE() {
    return new ExampleExtension(
        "backend-missing-image-dummy",
        lorIp,
        "",
        ExtensionType.BACKEND,
        ["backend"],
        [],
        "https://www.google.com",
        "1.0"
    );
}

export function getMissingImageDummyFE() {
    return new ExampleExtension(
        "frontend-missing-image-dummy",
        lorIp,
        "",
        ExtensionType.FRONTEND,
        ["frontend"],
        [],
        "https://www.google.com",
        "1.0"
    );
}

export function getNewVrDummyFE() {
    return new ExampleExtension(
        "frontend-extension-new-vr",
        feDesc,
        "img/augmented-reality.svg",
        ExtensionType.FRONTEND,
        ["backend", "frontend", "backend-extension-new-vr"],
        ["frontend-extension-vr"],
        "https://github.com/ExplorViz/explorviz-frontend-extension-vr",
        "1.1"
    );
}

export function getNewVrDummyBE() {
    return new ExampleExtension(
        "backend-extension-new-vr",
        beDesc,
        "img/augmented-reality.svg",
        ExtensionType.BACKEND,
        ["backend", "frontend", "frontend-extension-new-vr"],
        ["backend-extension-vr"],
        "https://github.com/ExplorViz/explorviz-backend-extension-vr",
        "1.1"
    );
}

/**
 * Generates an example extension.json file with mostly dummy extensions.
 */
export function generateExampleExtensionsJSON() {

    const ext1 = new ExampleExtension("backend-extension-vr",
                                beDesc,
                                "img/vr.png",
                                ExtensionType.BACKEND,
                                ["backend", "frontend", "frontend-extension-vr"],
                                [],
                                "https://github.com/ExplorViz/explorviz-backend-extension-vr",
                                "1.0"
    );

    const ext3 = new ExampleExtension("backend-extension-new-vr",
                                beDesc,
                                "img/vr.png",
                                ExtensionType.BACKEND,
                                ["backend", "frontend", "frontend-extension-new-vr"],
                                ["backend-extension-vr"],
                                "https://github.com/ExplorViz/explorviz-backend-extension-vr",
                                "1.1"
    );

    const ext5 = new ExampleExtension("backend",
                                evDesc,
                                "img/logo-be.png",
                                ExtensionType.BACKEND,
                                ["frontend"],
                                [],
                                "https://github.com/ExplorViz/explorviz-backend",
                                "1.0"
    );

    const ext2 = new ExampleExtension("frontend-extension-vr",
                                feDesc,
                                "img/vr.png",
                                ExtensionType.FRONTEND,
                                ["backend", "frontend", "backend-extension-vr"],
                                [],
                                "https://github.com/ExplorViz/explorviz-frontend-extension-vr",
                                "1.0"
    );
    const ext4 = new ExampleExtension("frontend-extension-new-vr",
                                feDesc,
                                "img/vr.png",
                                ExtensionType.FRONTEND,
                                ["backend", "frontend", "backend-extension-new-vr"],
                                ["frontend-extension-vr"],
                                "https://github.com/ExplorViz/explorviz-frontend-extension-vr",
                                "1.1"
    );

    const ext6 = new ExampleExtension("frontend",
                                evDesc,
                                "img/logo-fe.png",
                                ExtensionType.FRONTEND,
                                ["backend"],
                                [],
                                "https://github.com/ExplorViz/explorviz-frontend",
                                "1.0"
    );

    const ext7 = new ExampleExtension("backend-missing-image-dummy",
                                lorIp,
                                "",
                                ExtensionType.BACKEND,
                                ["backend"],
                                [],
                                "https://www.google.com",
                                "1.0"
    );

    const ext8 = new ExampleExtension("frontend-missing-image-dummy",
                                lorIp,
                                "",
                                ExtensionType.FRONTEND,
                                ["frontend"],
                                [],
                                "https://www.google.com",
                                "1.0"
    );

    const front = [];
    const back = [];

    back.push(ext5);
    front.push(ext6);
    back.push(ext1);
    front.push(ext2);
    back.push(ext3);
    front.push(ext4);

    for (let i = 0; i < 8; i++) {
        const fd = new ExampleExtension("frontend-extension-dummy" + i,
        lorIp + lorIp + lorIp + lorIp,
        "img/logo-fe.png",
        ExtensionType.FRONTEND,
        ["frontend"],
        [],
        "https://www.google.com",
        "1.0"
        );
        const bd = new ExampleExtension("backend-extension-dummy" + i,
        lorIp,
        "img/logo-be.png",
        ExtensionType.BACKEND,
        ["backend"],
        [],
        "https://www.google.com",
        "1.0"
        );
        front.push(fd);
        back.push(bd);
    }

    back.push(ext7);
    front.push(ext8);

    const newJson = {
        backend: back,
        frontend : front
    };

    try {
        fs.writeJsonSync("extensions.json", newJson);
    } catch (error) {
        console.log("Error writing file extensions.json.");
    }

    console.log(`Generated ${front.length} frontend and ${back.length} backend extensions.`);
}
