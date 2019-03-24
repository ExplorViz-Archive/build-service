# build-service

## Usage (without Docker)
### Requirements

- Git
- Node.js and npm

### Installation
1. Clone this repository via `git clone https://github.com/ExplorViz/build-service.git`
2. Install dependencies via `npm install`
3. Run the build script `npm run build` to compile the files
4. Use `node .` to start the application. 

The application should be up and running on localhost:8080. If you want to change the ip address please edit the ipAdress variable in src/server.ts berfore compiling.

It is advised to change the token variable in src/auth.ts before compiling to get full use of the GitHub API.
