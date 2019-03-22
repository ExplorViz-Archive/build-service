import nock from "nock";
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import status from "http-status"

chai.use(chaiAsPromised);
const expect = chai.expect;

import {Extension, ExtensionType, ExtensionLists, getExtensionLists} from "../src/extension"
import {extensionListsApiResponse, expectedLists} from "./scopes/getExtensionLists"

describe ("GET extensionLists", () => {
  const apiResponse = extensionListsApiResponse;

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
  it (`Should respond with expected value` + status[error], async () => {
    nock("https://api.github.com")
      .get("/search/repositories?q=explorviz+extension+in:name+org:ExplorViz")
      .reply(200, apiResponse)

    return expect(getExtensionLists()).to.eventually.eql(expectedLists);
  });
  







});
