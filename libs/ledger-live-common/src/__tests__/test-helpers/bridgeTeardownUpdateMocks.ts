import axios from "axios";
import { StdRequest } from "./types";
const fsp = require("fs").promises;

/* Creates a mock file from registered request */
async function createMock(stdRequest: StdRequest, path: string) {
  const uninterceptedAxiosInstance = axios.create();

  const createMockOp = async resp => {
    const responseInfo = { ...stdRequest.response };
    // Stores headers etc but no data
    delete stdRequest.response;
    delete responseInfo.body;
    // TODO: replace file fully, erase to 0 before
    return await fsp.writeFile(
      path,
      JSON.stringify({
        request: stdRequest,
        response: { ...responseInfo, body: resp?.data },
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
    response => createMockOp(response),
    error => createMockOp(error.response),
  );
}

export default (async function () {
  global.bridgeTestsObserver.disconnect();
  const dir = __dirname + "/bridgeMocks";
  const knownUrls: string[] = [];
  const filteredRequests: StdRequest[] = [];
  // TODO: Use SET, this will change with POST parameters support
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
