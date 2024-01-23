import { URL } from "url";
import axios from "axios";

const nock = require("nock");
const fs = require("fs");
const fsp = require("fs").promises;

export type StdRequest = {
  method: string;
  url: string;
  headers: any;
  fileName: string;
  body: any;
  response: any;
};

/* Loop through each mock and apply them to nock */
export async function initBackendMocks() {
  const root = `${__dirname}/bridgeMocks`;
  await fsp.readdir(root).then(async mocks => {
    console.log(`Found ${mocks.length} to apply`);
    let appliedMocks = 0;
    for (const mock of mocks) {
      appliedMocks++;
      //console.log("applied mock" + appliedMocks);
      const backendMock = await fsp.readFile(`${root}/${mock}`);
      try {
        const jsonBackendMock = JSON.parse(backendMock);
        applyBackendMock(jsonBackendMock);
      } catch (err) {
        console.log(err, mock);
      }
    }
    console.log(`Applied ${appliedMocks} out of ${mocks.length} files`);
  });
}

/* Creates a mock file from registered request */
export async function createMock(stdRequest: StdRequest, path: string) {
  const uninterceptedAxiosInstance = axios.create();

  const createMockObject = async (response: any) => {
    const responseInfo = { ...stdRequest.response };
    // Stores headers etc but no data
    delete stdRequest.response;
    delete responseInfo.body;
    await fsp.writeFile(
      path,
      JSON.stringify({
        request: stdRequest,
        response: { ...responseInfo, body: response?.data },
      }),
    );
  };

  try {
    const response = await uninterceptedAxiosInstance({
      method: stdRequest.method as any,
      url: stdRequest.url,
      data: stdRequest.body,
      headers: stdRequest.headers,
    });
    await createMockObject(response);
  } catch (error: any) {
    await createMockObject(error.response);
  }
  /*await uninterceptedAxiosInstance({
    method: stdRequest.method as any,
    url: stdRequest.url,
    data: stdRequest.body,
    headers: stdRequest.headers,
  })
    .catch(async error => {
      // We want to register error as it is real usage
      // happens on 404, example on cosmos account that has never been used
      return error.response;
    })
    .then(async response => {
      const responseInfo = { ...stdRequest.response };
      // Stores headers etc but no data
      delete stdRequest.response;
      delete responseInfo.body;
      await fsp.writeFile(
        path,
        JSON.stringify({
          request: stdRequest,
          response: { ...responseInfo, body: response?.data },
        }),
      );
    });*/
}

function applyBackendMock(mockContent: { request: StdRequest; response: any }) {
  const url = new URL(mockContent.request.url);

  const originWithoutPort =
    url.port && url.origin.includes(`:${url.port}`)
      ? url.origin.replace(`:${url.port}`, "")
      : url.origin;

  const endpoint = mockContent.request.url.replace(url.origin, "");

  switch (mockContent.request.method) {
    case "GET":
      nock(originWithoutPort)
        .persist()
        .get(endpoint)
        .reply(mockContent.response.statusCode, () => mockContent.response.body);
      break;
    case "POST":
      nock(originWithoutPort)
        .persist()
        .post(endpoint)
        .reply(mockContent.response.statusCode, () => mockContent.response.body);
      break;
    default:
      throw new Error("unknown method");
  }

  //console.log(nock.activeMocks());
}
