import * as fse from "fs-extra";

export interface Config {
    /**
     * Host to bind the webserver to
     * use 0.0.0.0 to bind to everything
     */
    host: string;
    /**
     * Port to bind to
     */
    port: number;
    /**
     * Tempoary file path for constructing packages
     * This should not be used by any other program
     */
    tmppath: string;
    /**
     * Storage path for caching of built package
     * configurations
     */
    cachePath: string;
    /**
     * Use defaultBranch to change the default directory to look for extensions.json file
     * for master-branch applications. This option is necessary to allow testing with the
     * build-service-test branch.
     * This should usually be
     * master
     */
    defaultBranch: string;
    /**
     * Auth token to use for the Github API. May be left empty, but may cause issues with 
     * rate limiting. 
     */
    githubToken: string;
    /**
     * Option to enable dev routes found in /routes/dev_router.ts. These are for testing 
     * and development purposes only.
     * This should usually be 
     * false
     */
    devOptions: boolean;
}

/**
 * Create the default Config object.
 */
function createDefaultConfig() {
    const config: Config = {
        cachePath: getEnvOrDefault("BUILDSERVICE_CACHE", "./cache"),
        host: getEnvOrDefault("BUILDSERVICE_HOST", "0.0.0.0"),
        port: getEnvOrDefault("BUILDSERVICE_PORT", 8080),
        tmppath: getEnvOrDefault("BUILDSERVICE_TEMP", "./tmp"),
        defaultBranch: getEnvOrDefault("BUILDSERVICE_BRANCH", "master"),
        githubToken: getEnvOrDefault("BUILDSERVICE_GITHUBTOKEN", ""),
        devOptions: getEnvOrDefault("BUILDSERVICE_DEV", false),
    };
    return config;
}

let config = null;
export function getConfig() : Config
{
    if(config !== null)
        return config;

    try {
        config = fse.readJsonSync("config.json");
        return config;
    } catch (error) {
        config = createDefaultConfig();
        if(getEnvOrDefault("BUILDSERVICE_NOCONFIG", false))
        {
            console.log("No config.json found. Using defaults.");
        }
        else 
        {
            console.log("No config.json found. Generating new file.");
            fse.writeJSONSync("config.json", config, {spaces: 2});
        }
        return config;
    }
}

/***
 * Returns the given environment variable or a default
 * Also converts the env var to the same type as the default
 */
function getEnvOrDefault(name: string, def: any)
{
    const val = process.env[name];
    if(val === undefined)
        return def;
    // Convert to the correct type via default type
    if(typeof(def) === "boolean")
        return val === "true";
    if(typeof(def) === "number")
        return Number(val);
    return val;
}