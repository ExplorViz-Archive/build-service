
import {buildConfiguration} from './artifact_builder'
import { Extension, ExtensionType } from './extension';

export class Task {
    promise: Promise<void>;
    status: String = "";
    constructor(extensions: Array<Extension>) {
        const self = this;
        this.promise = buildConfiguration(this, extensions);
    }

    getPromise() { return this.promise; }
    getStatus() { return this.status; }
    setStatus(newstatus: String) { this.status = newstatus; }

}