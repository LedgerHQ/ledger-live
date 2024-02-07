import { PerformanceObserver, PerformanceObserverCallback } from "node:perf_hooks";
import {
  HttpPerformanceEntry,
  HttpPerformanceEntryRequest,
  HttpPerformanceEntryResponse,
  StdRequest,
} from "./types";
import { createHash } from "crypto";

function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

/* 
Maps objects returned by node:perf_hooks into our model StdRequest
*/
function reqToStdRequest(
  nodeRequest: HttpPerformanceEntryRequest,
  nodeResponse: HttpPerformanceEntryResponse,
): StdRequest {
  return {
    method: nodeRequest.method,
    url: nodeRequest.url,
    headers: nodeRequest.headers,
    body: nodeRequest.body != null ? nodeRequest.body : {},
    fileName: sha256(`${nodeRequest.method}${nodeRequest.url}`),
    response: nodeResponse,
  };
}

/* Executed for each PerformanceEntry, includes more than http entries so we have to filter */
const onObserverEntry: PerformanceObserverCallback = (items, _observer) => {
  const entries = items.getEntries();
  for (const entry of entries) {
    if (entry.entryType === "http" || entry.entryType === "http2") {
      const httpEntry: HttpPerformanceEntry = entry as HttpPerformanceEntry;
      const req = httpEntry.detail?.req;
      const res = httpEntry.detail?.res;
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
  // eslint-disable-next-line no-console
  console.log("Observer started, starting network sniffing");
};
