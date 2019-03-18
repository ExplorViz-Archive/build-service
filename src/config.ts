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
     * Explorviz Frontend repository
     * This should usually be
     * https://github.com/ExplorViz/explorviz-frontend.git
     */
    frontendrepo: string;
    /**
     * Explorviz Backend repository
     * This should usually be
     * https://github.com/ExplorViz/explorviz-backend.git
     */
    backendrepo: string;
}

/**
 * Create the default Config object.
 */
export function createDefaultConfig() {
    const config: Config = {
        backendrepo: "https://github.com/ExplorViz/explorviz-backend.git",
        cachePath: "./cache",
        frontendrepo: "https://github.com/ExplorViz/explorviz-frontend.git",
        host: "0.0.0.0",
        port: 8080,
        tmppath: "./tmp"
    };
    return config;
}

export function getConfig() : Config
{
    try {
        return fse.readJsonSync("config.json");
    } catch (error) {
        console.log("No config.json found. Generating new file.");
        const config = createDefaultConfig();
        fse.writeJSONSync("config.json", config, {spaces: 2});
        return config;
      }
}