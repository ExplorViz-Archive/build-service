
import {getConfiguration} from "./artifact_builder";
import { Extension, ExtensionType } from "./extension";

export class Task {
    public promise: Promise<string>;
    public status: string = "";
    public hash: string = "";
    public url: string = "";
    constructor(extensions: Extension[]) {
        const self = this;
        [this.hash, this.promise] = getConfiguration(this, extensions);
        this.promise.then((downloadUrl: string) => {
            this.url = downloadUrl;
            this.setStatus("ready");
        });
    }

    public getPromise() { return this.promise; }
    public getStatus() { return this.status; }
    public getToken() { return this.hash; }
    public setStatus(newstatus: string) {
        console.log("New Status" + newstatus);
        this.status = newstatus; }
    public getDownload() { return this.url; }
}
