import path from "path";
import { customResourceEventMapper, scrubTrackedRequestUrls } from "./datadogResources";

const ADDRESS_URL = `https://explorers.example/blockchain/v4/eth/address/0x${"a1b2".repeat(10)}/txs`;
const SCRUBBED_URL = "https://explorers.example/blockchain/v4/eth/address/[redacted]/txs";
const CLEAN_URL = "https://countervalues.example/v3/spot/simple?froms=bitcoin&to=usd";
const DATADOG_TRACKING_CONTEXT = "_datadog_xhr";

class FakeRequest {
  static readonly HEADERS_RECEIVED = 2;
  static readonly DONE = 4;
  readyState = 0;
  status = 0;
  response: unknown = null;
  responseType = "";
  responseURL = "";
  onreadystatechange: (() => void) | null = null;
  sentWith: unknown[] | undefined;
  [DATADOG_TRACKING_CONTEXT]?: { url?: unknown };
  openedUrl?: string;

  open(_method: string, url: string) {
    this.openedUrl = url;
  }

  send(...args: unknown[]) {
    this.sentWith = args;
  }

  setRequestHeader() {}

  getResponseHeader() {
    return null;
  }

  complete(status: number) {
    this.status = status;
    this.readyState = FakeRequest.DONE;
    this.onreadystatechange?.();
  }
}

const createRequestType = () => class TestRequest extends FakeRequest {};

const installOn = (requestType: typeof FakeRequest) =>
  scrubTrackedRequestUrls(requestType as unknown as typeof XMLHttpRequest);

type ResourceEvent = Parameters<typeof customResourceEventMapper>[0];

const resourceEvent = (resourceContext: unknown): ResourceEvent =>
  ({
    key: "1/GET",
    statusCode: 200,
    kind: "xhr",
    size: 0,
    context: {},
    timestampMs: 0,
    resourceContext,
  }) as unknown as ResourceEvent;

describe("scrubTrackedRequestUrls", () => {
  it("scrubs the URL of a tracked request when it is sent", () => {
    const RequestType = createRequestType();
    installOn(RequestType);
    const request = new RequestType();
    request[DATADOG_TRACKING_CONTEXT] = { url: ADDRESS_URL };

    request.send("body");

    expect(request[DATADOG_TRACKING_CONTEXT]?.url).toBe(SCRUBBED_URL);
    expect(request.sentWith).toEqual(["body"]);
  });

  it("sends a request that is not tracked as it is", () => {
    const RequestType = createRequestType();
    installOn(RequestType);
    const request = new RequestType();

    request.send();

    expect(request[DATADOG_TRACKING_CONTEXT]).toBeUndefined();
    expect(request.sentWith).toEqual([]);
  });

  it("installs once per request type", () => {
    const RequestType = createRequestType();
    installOn(RequestType);
    const send = RequestType.prototype.send;

    installOn(RequestType);

    expect(RequestType.prototype.send).toBe(send);
  });

  describe("under the Datadog SDK request tracking", () => {
    const sdkRoot = path.dirname(require.resolve("@datadog/mobile-react-native/package.json"));
    const { XHRProxy } = jest.requireActual(
      path.join(
        sdkRoot,
        "lib/commonjs/rum/instrumentation/resourceTracking/requestProxy/XHRProxy/XHRProxy.js",
      ),
    );

    it("reports the scrubbed URL while the request goes to the real one", async () => {
      const RequestType = createRequestType();
      installOn(RequestType);
      const reportResource = jest.fn();
      const tracking = new XHRProxy({ xhrType: RequestType, resourceReporter: { reportResource } });
      tracking.onTrackingStart({ tracingSamplingRate: 0, firstPartyHostsRegexMap: [] });

      const request = new RequestType();
      request.open("GET", ADDRESS_URL);
      request.send();
      request.complete(200);
      await Promise.resolve();
      tracking.onTrackingStop();

      expect(request.openedUrl).toBe(ADDRESS_URL);
      expect(reportResource).toHaveBeenCalledWith(
        expect.objectContaining({ request: expect.objectContaining({ url: SCRUBBED_URL }) }),
      );
    });
  });
});

describe("customResourceEventMapper", () => {
  it("keeps a resource whose reported URL holds no identifier", () => {
    const event = resourceEvent({ [DATADOG_TRACKING_CONTEXT]: { url: SCRUBBED_URL } });
    expect(customResourceEventMapper(event)).toBe(event);
  });

  it("drops a resource whose reported URL still holds an identifier", () => {
    expect(
      customResourceEventMapper(
        resourceEvent({ [DATADOG_TRACKING_CONTEXT]: { url: ADDRESS_URL } }),
      ),
    ).toBe(null);
  });

  it("checks the request URL when the SDK context is missing", () => {
    const clean = resourceEvent({ responseURL: "", _url: CLEAN_URL });
    expect(customResourceEventMapper(clean)).toBe(clean);
    expect(customResourceEventMapper(resourceEvent({ responseURL: ADDRESS_URL }))).toBe(null);
  });

  it("drops a resource whose URL is unknown", () => {
    expect(customResourceEventMapper(resourceEvent(undefined))).toBe(null);
    expect(customResourceEventMapper(resourceEvent({}))).toBe(null);
  });

  it("drops a resource whose request cannot be read", () => {
    const unreadable = Object.defineProperty({}, "responseURL", {
      get() {
        throw new Error("unreadable");
      },
    });
    expect(customResourceEventMapper(resourceEvent(unreadable))).toBe(null);
  });
});
