import nock from "nock";
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import status from "http-status"
import {Extension, getExtensionLists, updateRequiredExtensions, ExtensionLists} from "../src/extension"
import {getMissingImageDummyBE, getMissingImageDummyFE, getNewVrDummyBE, getNewVrDummyFE} from "../src/exampleExtension"

chai.use(chaiAsPromised);
const expect = chai.expect;


describe("Extension constructor", () => {
  it("ExtensionType should be 1 if name includes backend", () => {
    return expect(new Extension ("this-is-a-backend-extension").extensionType).to.equal(1);
  });
  it("ExtensionType should be 0 if name includes frontend", () => {
    return expect(new Extension ("this-is-a-frontend-extension").extensionType).to.equal(0);
  });
  it("ExtensionType should be undefined if name includes neither", () => {
    return expect(new Extension ("this-is-an-extension").extensionType).to.equal(undefined);
  });
  it("Extension properties version, type, repository should be set if not null in constructor", () => {
    const expectedExtension = {
      name: "test",
      version: "master",
      repository: "https://www.google.com",
      extensionType: 1
    }
    return expect(new Extension("test", "master", 1, "https://www.google.com")).to.eql(expectedExtension);
  })
});

describe ("GET extensionLists", () => {
  const apiResponse = {
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

  let  error = 404;
  it (`Should throw error ${error} - ` + status[error], async () => {
    nock("https://api.github.com")
      .get("/search/repositories?q=explorviz+extension+in:name+org:ExplorViz")
      .reply(error)
    return expect(getExtensionLists()).to.eventually.be.rejectedWith(`${error} - ` + status[error]);
  });
  error = 101;
  it (`Should throw error ${error} - ` + status[error], async () => {
    nock("https://api.github.com")
      .get("/search/repositories?q=explorviz+extension+in:name+org:ExplorViz")
      .reply(error)
    return expect(getExtensionLists()).to.eventually.be.rejectedWith(`${error} - ` + status[error]);
  });
  it (`Should respond with expected value`, async () => {
    const expectedLists = {
      backend: [
        {
          name: "explorviz-backend-extension-vr",
          repository: "https://github.com/ExplorViz/explorviz-backend-extension-vr",
          version: "master", 
          extensionType: 1
        },
        {
         name: "explorviz-backend-extension-modeleditor",
         repository: "https://github.com/ExplorViz/explorviz-backend-extension-modeleditor",
         version: "master", 
         extensionType: 1
        },
        {
          name: "explorviz-backend-extension-dummy",
          repository: "https://github.com/ExplorViz/explorviz-backend-extension-dummy",
          version: "master",
          extensionType: 1
        }
      ],
      frontend: [
        {
          name: "explorviz-frontend-extension-modeleditor",
          repository: "https://github.com/ExplorViz/explorviz-frontend-extension-modeleditor",
          version: "master",
          extensionType: 0
        }
      ]
    }
    nock("https://api.github.com")
      .get("/search/repositories?q=explorviz+extension+in:name+org:ExplorViz")
      .reply(200, apiResponse)
    return expect(getExtensionLists()).to.eventually.eql(expectedLists);
  });
});

describe("Updating frontend and backend requirements", () => {
  const tmpList: ExtensionLists = {
    frontend: [],
    backend: []
  };

  tmpList.frontend.push(new Extension ("frontend", "master", 0, ""))
  tmpList.frontend.push(new Extension ("frontend", "1.3.0", 0, ""))
  tmpList.frontend.push(new Extension ("frontend", "dev-1", 0, ""))
  tmpList.frontend.push(getMissingImageDummyFE());
  tmpList.frontend.push(getNewVrDummyFE());
  tmpList.backend.push(new Extension ("backend", "master", 1, ""))
  tmpList.backend.push(new Extension ("backend", "1.3.0", 1, ""))
  tmpList.backend.push(new Extension ("backend", "dev-1", 1, ""))
  tmpList.backend.push(getMissingImageDummyBE());
  tmpList.backend.push(getNewVrDummyBE());

  it("Changing frontend and backend required extensions", () => {
    const newList = updateRequiredExtensions(tmpList);
    for(const extension of newList.backend) {
      if (extension.name === "backend") {
        expect(extension.requiredExtensions).to.eql([`frontend_${extension.version}`]);
      }
    }
    for(const extension of newList.frontend) {
      if (extension.name === "frontend") {
        expect(extension.requiredExtensions).to.eql([`backend_${extension.version}`]);
      }
    }   
  });

  it("Other extension's requirements are not changed", () => {
    const newList = updateRequiredExtensions(tmpList);
    for(const extension of newList.backend) {
      if (extension.name === "backend-missing-image") {
        expect(extension.requiredExtensions).to.eql(getMissingImageDummyBE().requiredExtensions);
      }
      if (extension.name === "backend-extension-new-vr") {
        expect(extension.requiredExtensions).to.eql(getNewVrDummyBE().requiredExtensions);
      }
    }
    for(const extension of newList.frontend) {
      if (extension.name === "frontend-extension-new-vr") {
        expect(extension.requiredExtensions).to.eql(getNewVrDummyFE().requiredExtensions);
      }
      if (extension.name === "frontend-missing-image") {
        expect(extension.requiredExtensions).to.eql(getMissingImageDummyFE().requiredExtensions);
      }
    } 
  });
});