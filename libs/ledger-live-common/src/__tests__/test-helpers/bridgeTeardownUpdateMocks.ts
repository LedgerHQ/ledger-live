/* eslint-disable no-console */
import axios from "axios";
import { StdRequest } from "./types";
import { promises as fsp } from "fs";

/* Creates a mock file from registered request */
async function createMock(stdRequest: StdRequest, path: string) {
  // usual instance has errors managed by live-network lib
  const uninterceptedAxiosInstance = axios.create();

  const createMockFile = async resp => {
    // TODO: replace file fully, erase to 0 before
    return await fsp.writeFile(
      path,
      JSON.stringify({
        request: { url: stdRequest.url, method: stdRequest.method },
        response: { statusCode: resp.statusCode, body: resp?.data },
      }),
      { flag: "wx" },
    );
  };

  return uninterceptedAxiosInstance({
    method: stdRequest.method as any,
    url: stdRequest.url,
    data: stdRequest.body,
    headers: stdRequest.headers,
    timeout: 1 * 60 * 1000,
  }).then(
    response => createMockFile(response),
    error => createMockFile(error.response),
  );
}

export default (async function () {
  global.bridgeTestsObserver.disconnect();
  const dir = __dirname + "/bridgeMocks";
  const knownUrls: string[] = [];
  const filteredRequests: StdRequest[] = [];
  // TODO: This will change with POST parameters support, we will need to manage multiple requests types
  for (const req of global.bridgeTestsRequests) {
    if (!knownUrls.includes(req.url)) {
      knownUrls.push(req.url);
      filteredRequests.push(req);
    }
  }
  console.log(`Starting mock file creation : ${filteredRequests.length} different network calls`);
  const mockCreations = filteredRequests.map(request =>
    createMock(request, `${dir}/${request.fileName}.json`),
  );
  await Promise.allSettled(mockCreations).then(result => {
    console.log(`${result.filter(r => r.status === "fulfilled").length} new mocks !`);
  });
  console.log("Finished mock file creation");
});
