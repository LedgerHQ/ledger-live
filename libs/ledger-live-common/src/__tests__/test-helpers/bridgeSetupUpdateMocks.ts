import { PerformanceObserver, PerformanceObserverCallback } from "node:perf_hooks";
import { StdRequest } from "./types";
const { createHash } = require("crypto");

function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}

/* 
Maps native object returned by node:perf_hooks into our model StdRequest
TODO: find types
*/
function reqToStdRequest(nodeRequest: any, nodeResponse: any): StdRequest {
  return {
    method: nodeRequest.method,
    url: nodeRequest.url,
    headers: nodeRequest.headers,
    body: nodeRequest.body != null ? nodeRequest.body : {},
    fileName: sha256(`${nodeRequest.method}${nodeRequest.url}`),
    response: nodeResponse,
  };
}

// TODO: find more accurate type
const onObserverEntry: PerformanceObserverCallback = (items, _observer) => {
  const entries = items.getEntries();
  for (const entry of entries) {
    if (entry.entryType === "http") {
      const req = (entry as any).detail?.req;
      const res = (entry as any).detail?.res;
      if (res != null && req != null) {
        global.bridgeTestsRequests.push(reqToStdRequest(req, res));
      }
    }
  }
};

export default () => {
  global.bridgeTestsRequests = [];
  // We start sniffing traffic, after all tests we will create a mock for each entry
  global.bridgeTestsObserver = new PerformanceObserver(onObserverEntry);
  global.bridgeTestsObserver.observe({ entryTypes: ["http", "http2"] });
  console.log("Observer started, starting network sniffing");
};
