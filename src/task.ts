
import {getConfiguration} from "./artifact_builder";
import { Extension } from "./extension";
import {configurationHash} from "./artifact_cache";

export enum TaskState {
    INIT,
    FRONTEND_PREPARE,
    FRONTEND_EXTENSION,
    FRONTEND,
    BACKEND_PREPARE,
    BACKEND,
    BACKEND_EXTENSION,
    PACKING,
    READY,
    FAILED
}

export class Task {
    public static activeTasks = {};
    public static getTask(extensions : Extension[]) : Task 
    {
        const hash = configurationHash(extensions);
        if(Task.activeTasks[hash] === undefined)
        {
            Task.activeTasks[hash] = new Task(extensions);
            Task.activeTasks[hash].run();
        }
        return Task.activeTasks[hash];
    }

    public promise: Promise<void>;
    public status: TaskState = TaskState.INIT;
    public hash: string = "";
    public extensions : Extension[]
    private constructor(extensions: Extension[]) {
        this.extensions = extensions;
        this.hash = configurationHash(extensions);
    }

    public run()
    {
        getConfiguration(this).catch(() => {
            this.setStatus(TaskState.FAILED);
        });
    }
    public getPromise() { return this.promise; }
    public getStatus() { return this.status.toString(); }
    public getToken() { return this.hash; }
    public setStatus(newstatus: TaskState) { this.status = newstatus; }
    public getDownload() { return this.hash; }
}
