import nock from "nock";
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import status from "http-status"
import {Extension, getExtensionLists, updateBaseFields, ExtensionLists, defaultDescr, defaultimgSrc} from "../src/extension"
import {getMissingImageDummyBE, getMissingImageDummyFE, getNewVrDummyBE, getNewVrDummyFE} from "../src/exampleExtension"

chai.use(chaiAsPromised);
const expect = chai.expect;


describe("Extension constructor", () => {
  it("Extension properties should be set correctly", () => {
    const expectedExtension = new Extension("test", "master", 1, "https://www.google.com");
    expect(expectedExtension.name).to.equal("test");
    expect(expectedExtension.extensionType).to.equal(1);
    expect(expectedExtension.version).to.equal("master");
    expect(expectedExtension.repository).to.equal("https://www.google.com");
    expect(expectedExtension.isBase).to.equal(false);
    expect(expectedExtension.commit).to.equal("master");
    expect(expectedExtension.requiredExtensions).to.eql(["frontend_master", "backend_master"]);
    expect(expectedExtension.incompatibleExtensions).to.eql([]);
    expect(expectedExtension.imgSrc).to.equal(defaultimgSrc);
    expect(expectedExtension.desc).to.equal(defaultDescr);
    expect(expectedExtension.id).to.equal("test_master");
  })
  it("The isBase property should only be set to true for frontend and backend versions, not for extensions", () => {
    expect(new Extension("frontend", "master", 0, "").isBase).to.equal(true);
    expect(new Extension("backend", "master", 1, "").isBase).to.equal(true);
    expect(new Extension("backend-extension-vr", "master", 1, "").isBase).to.equal(false);
    expect(new Extension("frontend-extension-vr", "master", 0, "").isBase).to.equal(false);
    expect(new Extension("test", "master", undefined, "").isBase).to.equal(false);
  });
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
          extensionType: 1,
          isBase: false,
          commit: "master",
          requiredExtensions: ["frontend_master", "backend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-backend-extension-vr_master"
        },
        {
         name: "explorviz-backend-extension-modeleditor",
         repository: "https://github.com/ExplorViz/explorviz-backend-extension-modeleditor",
         version: "master", 
         extensionType: 1,
         isBase: false,
         commit: "master",
         requiredExtensions: ["frontend_master", "backend_master"],
         incompatibleExtensions: [],
         imgSrc: defaultimgSrc,
         desc: defaultDescr, 
         id: "explorviz-backend-extension-modeleditor_master"
        },
        {
          name: "explorviz-backend-extension-dummy",
          repository: "https://github.com/ExplorViz/explorviz-backend-extension-dummy",
          version: "master",
          extensionType: 1,
          isBase: false,
          commit: "master",
          requiredExtensions: ["frontend_master", "backend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-backend-extension-dummy_master"
        }
      ],
      frontend: [
        {
          name: "explorviz-frontend-extension-modeleditor",
          repository: "https://github.com/ExplorViz/explorviz-frontend-extension-modeleditor",
          version: "master",
          extensionType: 0,
          isBase: false,
          commit: "master",
          requiredExtensions: ["frontend_master", "backend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-frontend-extension-modeleditor_master"
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
    const newList = updateBaseFields(tmpList);
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
    const newList = updateBaseFields(tmpList);
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