
import {getConfiguration} from './artifact_builder'
import { Extension, ExtensionType } from './extension';

export class Task {
    promise: Promise<String>;
    status: String = "";
    hash: string = "";
    url: String = "";
    constructor(extensions: Array<Extension>) {
        const self = this;
        [this.hash, this.promise] = getConfiguration(this, extensions);
        this.promise.then((downloadUrl : String) => 
        {
            this.url = downloadUrl;
            this.status = "ready";
        });
    }

    getPromise() { return this.promise; }
    getStatus() { return this.status; }
    getToken() { return this.hash; }
    setStatus(newstatus: String) { this.status = newstatus; }
    getDownload() { return this.url; }
}