# build-service

A service to dynamically fetch Explorviz setups with a custom selection of extensions. 

## Installation (without Docker)
### Requirements

- Git
- Node.js and npm
- ember.js and a JDK suitable for compiling Explorviz (only required for running builds)

### Commands
1. Clone this repository via `git clone https://github.com/ExplorViz/build-service.git`
2. Install dependencies via `npm install`
3. Run the build script `npm run build` to compile the files
4. Use `node .` to start the application. 

## Installation (Docker)
### Requirements

- Docker

### Commands
1. Clone this repository via `git clone https://github.com/ExplorViz/build-service.git`
2. Run `docker build -t explorviz/build-service`
3. Then run `docker run -p 8080:8080 explorviz/build-service` to start the application

After updating the list of extensions the application should be up and running on localhost:8080.

## Configuration

The build service may either be configured via environment variables or a config.json file. If both are present, a valid config.json takes precedence. The config.json file offers options to configure important variables. Available options are:

  - `host` (`BUILDSERVICE_HOST`): The IP-Adress for the webserver to run on. This should be "0.0.0.0" if access from everywhere is intended.
  - `port` (`BUILDSERVICE_PORT`): The Port for the server to run on. 
  - `defaultBranch` (`BUILDSERVICE_BRANCH`): The branch for the extension module to look for extensions.json files for extensions on the master branch. Change this if you want to test changes to the extensions.json files on different branches. This should usually be set to master.
  - `devOptions` (`BUILDSERVICE_DEV`): Enables the use of the dev-router found in /src/routes/dev-router.ts.
  - `cache` (`BUILDSERVICE_CACHE`): Directory to use for caching of finished builds.
  - `tmp` (`BUILDSERVICE_TEMP`): Directory to use for in-progress builds.
  - `githubToken` (`BUILDSERVICE_GITHUBTOKEN`): API Token for the Github API. This needs to be set to allow more than 60 API requests per hour. 

If no config.json is present at startup, a default one will be created. To suppress this behavior the environment variable `BUILDSERVICE_NOCONFIG` may be set to `true` to prevent creation of a config.json. This is intended for setups where configuration via environment variables may be desired (e.g. Docker). 

## Additional commands

- `npm run devTest` to run the application without compiling first
- `npm run dev` to compile and restart the application upon changes in the source code
- `npm run lint` to perform a style check on the application
- `npm run test` to run the test script
