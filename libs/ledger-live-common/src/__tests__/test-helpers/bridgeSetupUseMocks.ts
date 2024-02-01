import nock from "nock";
import { URL } from "url";
import { StdRequest } from "./types";
const fsp = require("fs").promises;

/* Loop through each mock and apply them to nock */
export async function initBackendMocks() {
  const root = `${__dirname}/bridgeMocks`;
  await fsp.readdir(root).then(async mocks => {
    console.log(`Found ${mocks.length} to apply`);
    let appliedMocks = 0;
    for (const mock of mocks) {
      appliedMocks++;
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
}

export default async () => {
  nock.disableNetConnect();
  await initBackendMocks();
};
