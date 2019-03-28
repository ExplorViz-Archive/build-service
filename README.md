# build-service

## Usage (without Docker)
### Requirements

- Git
- Node.js and npm
- ember.js and a JDK suitable for compiling Explorviz (only required for running builds)

### Installation
1. Clone this repository via `git clone https://github.com/ExplorViz/build-service.git`
2. Install dependencies via `npm install`
3. Run the build script `npm run build` to compile the files
4. Use `node .` to start the application. 

After updating the list of extensions the application should be up and running on localhost:8080. If you want to change the ip address please edit the ipAdress variable in src/server.ts berfore compiling.

It is advised to change the token variable in src/auth.ts before compiling to get full use of the GitHub API.


## Additional commands

- `npm run devTest` to run the application without compiling first
- `npm run dev` to compile and restart the application upon changes in the source code
- `npm run lint` to perform a style check on the application
- `npm run test` to run the test script

## Usage (Docker)
### Requirements

- Docker

### Installation
1. Clone this repository via `git clone https://github.com/ExplorViz/build-service.git`
2. Run `docker build -t explorviz/build-service`
3. Then run `docker run -p 8080:8080 explorviz/build-service` to start the application

After updating the list of extensions the application should be up and running on localhost:8080. 
