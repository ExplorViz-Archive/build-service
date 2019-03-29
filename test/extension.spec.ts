import nock from "nock";
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import status from "http-status"
import {
  Extension, 
  getExtensionLists, 
  updateBaseFields, 
  ExtensionLists, 
  defaultDescr, 
  defaultimgSrc,
  defaultBranch,
  getExtensionReleases,
  addReleaseRepositories,
  combineExtensionInformation,
  ExtensionType,
  ExtensionJSONObject
} from "../src/extension"
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

describe ("getExtensionLists", () => {
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
          id: "explorviz-backend-extension-vr_master",
          active: true
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
         id: "explorviz-backend-extension-modeleditor_master",
         active: true
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
          id: "explorviz-backend-extension-dummy_master",
          active: true
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
          id: "explorviz-frontend-extension-modeleditor_master",
          active: true
        }
      ]
    }
    nock("https://api.github.com")
      .get("/search/repositories?q=explorviz+extension+in:name+org:ExplorViz")
      .reply(200, apiResponse)
    return expect(getExtensionLists()).to.eventually.eql(expectedLists);
  });
});

describe ("addReleaseRepositories", () => {
  const apiResponseFrontend = [
    {
      "html_url": "https://github.com/ExplorViz/explorviz-frontend/releases/tag/1.3.0",
      "id": 15484656,
      "tag_name": "10.3.0",
      "target_commitish": "master",
      "name": "10.3.0 (stable)",
    }
  ]
  const apiResponseBackend = [
  ]

  let  error = 404;
  it (`Should throw error ${error} - ` + status[error], async () => {
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-frontend/releases")
      .reply(error)
    return expect(getExtensionReleases("explorviz-frontend")).to.eventually.be.rejectedWith(`${error} - ` + status[error]);
  });
  error = 101;
  it (`Should throw error ${error} - ` + status[error], async () => {
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-frontend/releases")
      .reply(error)
    return expect(getExtensionReleases("explorviz-frontend")).to.eventually.be.rejectedWith(`${error} - ` + status[error]);
  });
  it (`Should respond with expected value`, async () => {
    const oldList = {
      backend: [
        {
          name: "explorviz-backend",
          repository: "https://github.com/ExplorViz/explorviz-backend",
          version: "master", 
          extensionType: 1,
          isBase: true,
          commit: "master",
          requiredExtensions: ["frontend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-backend_master",
          active: true
        }
      ],
      frontend: [
        {
          name: "explorviz-frontend",
          repository: "https://github.com/ExplorViz/explorviz-frontend",
          version: "master",
          extensionType: 0,
          isBase: true,
          commit: "master",
          requiredExtensions: ["backend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-frontend_master",
          active: true
        }
      ]
    }
    const expectedLists = {
      backend: [
        {
          name: "explorviz-backend",
          repository: "https://github.com/ExplorViz/explorviz-backend",
          version: "master", 
          extensionType: 1,
          isBase: true,
          commit: "master",
          requiredExtensions: ["frontend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-backend_master",
          active: true
        }
      ],
      frontend: [
        {
          name: "explorviz-frontend",
          repository: "https://github.com/ExplorViz/explorviz-frontend",
          version: "master",
          extensionType: 0,
          isBase: true,
          commit: "master",
          requiredExtensions: ["backend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-frontend_master",
          active: true
        },
        {
          name: "explorviz-frontend",
          repository: "https://github.com/ExplorViz/explorviz-frontend",
          version: "10.3.0",
          extensionType: 0,
          isBase: false,
          commit: "10.3.0",
          requiredExtensions: ["frontend_master", "backend_master"],
          incompatibleExtensions: [],
          imgSrc: defaultimgSrc,
          desc: defaultDescr, 
          id: "explorviz-frontend_10.3.0",
          active: true
        }
      ]
    }
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-frontend/releases")
      .reply(200, apiResponseFrontend);
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/releases")
      .reply(200, apiResponseBackend);
    
    const result: ExtensionLists = {
      frontend: [],
      backend: []
    }
    result.frontend = await addReleaseRepositories(oldList.frontend);
    result.backend = await addReleaseRepositories(oldList.backend);
    return expect(result).to.eql(expectedLists);
  });
});

describe("Updating frontend and backend requirements", () => {
  const tmpList: ExtensionLists = {
    frontend: [],
    backend: []
  };

  // Check if isBase is changed
  const newFrontend = new Extension ("explorviz-frontend", "master", 0, "");
  expect(newFrontend.isBase).to.equal(false);
  newFrontend.name = "frontend";

  tmpList.frontend.push(newFrontend)
  tmpList.frontend.push(new Extension ("frontend", "1.3.0", 0, ""))
  tmpList.frontend.push(new Extension ("frontend", "dev-1", 0, ""))
  tmpList.frontend.push(getMissingImageDummyFE());
  tmpList.frontend.push(getNewVrDummyFE());
  tmpList.backend.push(new Extension ("backend", "master", 1, ""))
  tmpList.backend.push(new Extension ("backend", "1.3.0", 1, ""))
  tmpList.backend.push(new Extension ("backend", "dev-1", 1, ""))
  tmpList.backend.push(getMissingImageDummyBE());
  tmpList.backend.push(getNewVrDummyBE());

  it("Changing frontend and backend required extensions and isBase", () => {
    const newList = updateBaseFields(tmpList);
    let i = 0;
    for(const extension of newList.backend) {
      if (extension.name === "backend") {
        expect(extension.requiredExtensions).to.eql([`frontend_${extension.version}`]);
        expect(extension.isBase).to.equal(true);
        i++;
      }
    }
    expect(i).to.equal(3);
    let j = 0;
    for(const extension of newList.frontend) {
      if (extension.name === "frontend") {
        expect(extension.requiredExtensions).to.eql([`backend_${extension.version}`]);
        expect(extension.isBase).to.equal(true);
        j++;
      }
    }   
    expect(j).to.equal(3);
  });

  it("Other extension's requirements are not changed", () => {
    const newList = updateBaseFields(tmpList);
    for(const extension of newList.backend) {
      if (extension.name === "backend-missing-image") {
        expect(extension.requiredExtensions).to.eql(getMissingImageDummyBE().requiredExtensions);
        expect(extension.isBase).to.eql(false);
      }
      if (extension.name === "backend-extension-new-vr") {
        expect(extension.requiredExtensions).to.eql(getNewVrDummyBE().requiredExtensions);
        expect(extension.isBase).to.eql(false);
      }
    }
    for(const extension of newList.frontend) {
      if (extension.name === "frontend-extension-new-vr") {
        expect(extension.requiredExtensions).to.eql(getNewVrDummyFE().requiredExtensions);
        expect(extension.isBase).to.eql(false);
      }
      if (extension.name === "frontend-missing-image") {
        expect(extension.requiredExtensions).to.eql(getMissingImageDummyFE().requiredExtensions);
        expect(extension.isBase).to.eql(false);
      }
    } 
  });
});


describe ("combineExtensionInformation", () => {
  const extensionJSON: ExtensionJSONObject = {
      "imgSrc": "augmented-reality_2.svg",
      "requiredExtensions": [
        "frontend_master",
        "backend_master",
        "backend-extension-vr_master"
      ],
      "incompatibleExtensions": [],
      "active": true
  }
  const faultyExtensionJSON: ExtensionJSONObject = {
    "imgSrc": "augmented-reality_2.svg",
    "requiredExtensions": [
      "frontend_master",
      "backend_master",
      "backend-extension-vr_master",
    ],
    "incompatibleExtensions": [],
    "active": true
  }  
  it (`Should respond with default values if not found`, async () => {
    const backend: Extension[] = [
      {
        name: "backend",
        repository: "https://github.com/ExplorViz/explorviz-backend",
        version: "master", 
        extensionType: 1,
        isBase: false,
        commit: "master",
        requiredExtensions: ["frontend_master", "backend_master"],
        incompatibleExtensions: [],
        imgSrc: defaultimgSrc,
        desc: defaultDescr, 
        id: "backend_master",
        active: true
      }
    ]
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/contents/extensions.json?ref=" + defaultBranch)
      .reply(404);
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/readme?ref=" + defaultBranch)
      .reply(404);
    const tmp = [new Extension("explorviz-backend", "master", 1, "https://github.com/ExplorViz/explorviz-backend")];
    const result = await combineExtensionInformation(tmp);
    expect(result).to.eql(backend);
  });
  it (`Should respond with default desc if ## Project Description not found`, async () => {
    const header = "Some stuff Project Description"
    const customDesc = " Testing this feature! To be removed at some time "
    const footer = "## Second title is beautifull"
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/contents/extensions.json?ref=" + defaultBranch)
      .reply(200, extensionJSON);
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/readme?ref=" + defaultBranch)
      .reply(200, header + customDesc + footer);
    const tmp = [new Extension("explorviz-backend", "master", 1, "https://github.com/ExplorViz/explorviz-backend")];
    const result = await combineExtensionInformation(tmp);
    expect(result[0].desc).to.equal(defaultDescr);
  });
  it (`Should respond with custom desc if found and correctly set (two titles)`, async () => {
    const header = "Some stuff ## Project Description"
    const customDesc = " Testing this feature! To be removed at some time "
    const footer = "## Second title is beautifull"
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/contents/extensions.json?ref=" + defaultBranch)
      .reply(200, extensionJSON);
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/readme?ref=" + defaultBranch)
      .reply(200, header + customDesc + footer);
    const tmp = [new Extension("explorviz-backend", "master", 1, "https://github.com/ExplorViz/explorviz-backend")];
    const result = await combineExtensionInformation(tmp);
    expect(result[0].desc).to.equal(customDesc.trim());
  });
  it (`Should respond with custom desc if found and correctly set (one title)`, async () => {
    const header = "Some stuff ## Project Description"
    const customDesc = " Testing this feature! To be removed at some time "
    const footer = " Second title is beautifull"
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/contents/extensions.json?ref=" + defaultBranch)
      .reply(200, extensionJSON);
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/readme?ref=" + defaultBranch)
      .reply(200, header + customDesc + footer);
    const tmp = [new Extension("explorviz-backend", "master", 1, "https://github.com/ExplorViz/explorviz-backend")];
    const result = await combineExtensionInformation(tmp);
    expect(result[0].desc).to.equal((customDesc + footer).trim());
  });
  it (`Should respond with custom information if found`, async () => {
    const header = "Some stuff ## Project Description"
    const customDesc = " Testing this feature! To be removed at some time "
    const footer = " Second title is beautifull"
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/contents/extensions.json?ref=" + defaultBranch)
      .reply(200, extensionJSON);
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/readme?ref=" + defaultBranch)
      .reply(200, header + customDesc + footer);
    const tmp = [new Extension("explorviz-backend", "master", 1, "https://github.com/ExplorViz/explorviz-backend")];
    const result = await combineExtensionInformation(tmp);
    expect(result[0].requiredExtensions).to.eql(extensionJSON.requiredExtensions);
    expect(result[0].incompatibleExtensions).to.eql(extensionJSON.incompatibleExtensions);
    expect(result[0].imgSrc).to.eql(extensionJSON.imgSrc);
  });
  it (`Should respond with custom information if found`, async () => {
    const header = "Some stuff ## Project Description"
    const customDesc = " Testing this feature! To be removed at some time "
    const footer = " Second title is beautifull"
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/contents/extensions.json?ref=" + defaultBranch)
      .reply(200, faultyExtensionJSON);
    nock("https://api.github.com")
      .get("/repos/ExplorViz/explorviz-backend/readme?ref=" + defaultBranch)
      .reply(200, header + customDesc + footer);
    const tmp = [new Extension("explorviz-backend", "master", 1, "https://github.com/ExplorViz/explorviz-backend")];
      
    await combineExtensionInformation(tmp)

    expect(true)

    });
  
});