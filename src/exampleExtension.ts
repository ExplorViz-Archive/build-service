
/**
 * Generate new dummy extensions
 */

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
    id: string;
    desc: string;
    extensionType: ExtensionType;
    imgSrc: string;
    incompatibleExtensions: string[];
    name: string;
    repository: string;
    requiredExtensions: string[];
    version: string;
}

class ExampleExtension implements ExtensionObject {
    public id: string;
    public desc: string;
    public imgSrc: string;
    public incompatibleExtensions: string[];
    public name: string;
    public requiredExtensions: string[];
    public repository: string;
    public version: string;
    public extensionType: ExtensionType;

    constructor(name: string,
                desc: string,
                imgSrc: string,
                extensionType: ExtensionType,
                requiredExtensions: string[],
                incompatibleExtensions: string[],
                repository: string,
                version: string) {
        this.id = name + "_" + version;
        this.name = name;
        this.desc = desc;
        this.imgSrc = imgSrc;
        this.requiredExtensions = requiredExtensions;
        this.incompatibleExtensions = incompatibleExtensions;
        this.repository = repository;
        this.version = version;
        this.extensionType = extensionType;
    }

    public isBase() { return false; }
}

enum ExtensionType {
    FRONTEND,
    BACKEND
}

export function getMissingImageDummyBE() {
    return new ExampleExtension(
        "backend-missing-image",
        lorIp,
        "daiopjghfbdsafgakldfgölkj",
        ExtensionType.BACKEND,
        ["backend_1.3.0"],
        [],
        "https://www.google.com",
        "master"
    );
}

export function getMissingImageDummyFE() {
    return new ExampleExtension(
        "frontend-missing-image",
        lorIp,
        "https://pbs.twimg.com/profile_images/807755806837850112/WSFVeFeQ_400x400.jpg",
        ExtensionType.FRONTEND,
        ["frontend_1.3.0"],
        [],
        "https://www.google.com",
        "master"
    );
}

export function getNewVrDummyFE() {
    return new ExampleExtension(
        "frontend-extension-new-vr",
        feDesc,
        "augmented-reality.svg",
        ExtensionType.FRONTEND,
        ["backend_1.3.0", "frontend_1.3.0", "backend-extension-new-vr_master"],
        ["frontend-extension-vr"],
        "https://github.com/ExplorViz/explorviz-frontend-extension-vr",
        "master"
    );
}

export function getNewVrDummyBE() {
    return new ExampleExtension(
        "backend-extension-new-vr",
        beDesc,
        "augmented-reality.svg",
        ExtensionType.BACKEND,
        ["backend_1.3.0", "frontend_1.3.0", "frontend-extension-new-vr_master"],
        ["backend-extension-vr"],
        "https://github.com/ExplorViz/explorviz-backend-extension-vr",
        "master"
    );
}
