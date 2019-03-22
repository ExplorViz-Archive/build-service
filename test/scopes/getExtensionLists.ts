import { isMaster } from "cluster";

export const extensionListsApiResponse = {
  "items": [
    {
      "name": "explorviz-backend-extension-vr",
      "html_url": "https://github.com/ExplorViz/explorviz-backend-extension-vr",
    },
    {
      "name": "explorviz-frontend-extension-modeleditor",
      "html_url": "https://github.com/ExplorViz/explorviz-frontend-extension-modeleditor",
    },
    {
      "name": "explorviz-backend-extension-modeleditor",
      "html_url": "https://github.com/ExplorViz/explorviz-backend-extension-modeleditor",
    },
    {
      "name": "explorviz-backend-extension-dummy",
      "html_url": "https://github.com/ExplorViz/explorviz-backend-extension-dummy",
    }
  ]
}


export const expectedLists = {
  backend: [
    {
      name: "explorviz-backend-extension-vr",
      repository: "https://github.com/ExplorViz/explorviz-backend-extension-vr",
      version: "master"
    },
    {
     name: "explorviz-backend-extension-modeleditor",
     repository: "https://github.com/ExplorViz/explorviz-backend-extension-modeleditor",
     version: "master" 
    },
    {
      name: "explorviz-backend-extension-dummy",
      repository: "https://github.com/ExplorViz/explorviz-backend-extension-dummy",
      version: "master"
    }
  ],
  frontend: [
    {
      name: "explorviz-frontend-extension-modeleditor",
      repository: "https://github.com/ExplorViz/explorviz-frontend-extension-modeleditor",
      version: "master"
    }
  ]
}