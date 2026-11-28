import path from "path";
import { DatadogProvider, DdLogs, TrackingConsent } from "@datadog/mobile-react-native";
import { setCoinObservabilityConfigReader } from "@features/platform-coin-observability";
import {
  ErrorCategory,
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
} from "@ledgerhq/transaction-observability";
import {
  broadcastLogger,
  coinModuleCallLogger,
  customErrorEventMapper,
  customResourceEventMapper,
  initializeDatadogProvider,
  isDatadogRecording,
  scrubTrackedRequestUrls,
  stopDatadogRecording,
  transactionBroadcastLogger,
} from "./datadog";

const observabilityOn = {
  includeSyncPath: true,
  syncPathSampleRate: 0.1,
  preparationSampleRate: 0.1,
  maxFailuresPerKey: 5,
};

jest.mock("@datadog/mobile-react-native", () => ({
  DdLogs: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  TrackingConsent: { GRANTED: "granted", NOT_GRANTED: "not_granted" },
  DatadogProvider: { initialize: jest.fn() },
}));

jest.mock("@datadog/mobile-react-navigation", () => ({}));
jest.mock("./const", () => ({ ScreenName: {} }));
jest.mock("./utils/datadogUtils", () => ({ buildFeatureFlagTags: jest.fn(() => ({})) }));

describe("isDatadogRecording", () => {
  it("is false until the provider is initialized with the user's consent", () => {
    expect(isDatadogRecording()).toBe(false);
  });
});

describe("recording gate", () => {
  const initialize = jest.mocked(DatadogProvider.initialize);
  let initializeProvider: typeof initializeDatadogProvider;
  let isRecording: typeof isDatadogRecording;
  let stopRecording: typeof stopDatadogRecording;

  beforeEach(() => {
    process.env.DATADOG_CLIENT_TOKEN_VAR = "token";
    process.env.DATADOG_APPLICATION_ID_VAR = "app-id";
    jest.isolateModules(() => {
      ({
        initializeDatadogProvider: initializeProvider,
        isDatadogRecording: isRecording,
        stopDatadogRecording: stopRecording,
      } = require("./datadog"));
    });
    initialize.mockReset();
  });

  afterEach(() => {
    delete process.env.DATADOG_CLIENT_TOKEN_VAR;
    delete process.env.DATADOG_APPLICATION_ID_VAR;
  });

  it("opens once the provider is initialized with the user's consent", async () => {
    await initializeProvider({}, TrackingConsent.GRANTED);

    expect(isRecording()).toBe(true);
  });

  it("stays closed without the user's consent", async () => {
    await initializeProvider({}, TrackingConsent.NOT_GRANTED);

    expect(isRecording()).toBe(false);
  });

  it("closes when recording is stopped, e.g. the feature flag is turned off", async () => {
    await initializeProvider({}, TrackingConsent.GRANTED);

    stopRecording();

    expect(isRecording()).toBe(false);
  });

  it("is not reopened by an initialization that completes after recording was stopped", async () => {
    let finish: () => void = () => {};
    initialize.mockReturnValueOnce(new Promise<void>(resolve => (finish = resolve)));
    const pending = initializeProvider({}, TrackingConsent.GRANTED);

    stopRecording();
    finish();
    await pending;

    expect(isRecording()).toBe(false);
  });

  it("is not reopened by an older initialization that completes after a newer one", async () => {
    let finishOlder: () => void = () => {};
    initialize.mockReturnValueOnce(new Promise<void>(resolve => (finishOlder = resolve)));
    const older = initializeProvider({}, TrackingConsent.GRANTED);
    await initializeProvider({}, TrackingConsent.NOT_GRANTED);

    finishOlder();
    await older;

    expect(isRecording()).toBe(false);
  });
});

describe("customErrorEventMapper", () => {
  const mapError = customErrorEventMapper(false);

  it("drops Braze content cards sync failures", () => {
    expect(
      mapError({
        message: "BrazeKit.ContentCards.Error.syncFailure",
        stacktrace: "",
      } as Parameters<typeof mapError>[0]),
    ).toBeNull();
  });

  it("keeps unrelated errors", () => {
    const event = {
      message: "Something went wrong",
      stacktrace: "",
      context: {},
    } as Parameters<typeof mapError>[0];

    expect(mapError(event)).toEqual(
      expect.objectContaining({
        message: "Something went wrong",
      }),
    );
  });
});

describe("broadcastLogger", () => {
  it("calls DdLogs.info with correct parameters on success event", () => {
    const infoSpy = jest.spyOn(DdLogs, "info");

    broadcastLogger({
      status: "success",
      appVersion: "1.0.0",
      currencyId: "bitcoin",
      family: "family",
      isTestnet: false,
      isSendMax: true,
      source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: true } },
    });

    expect(infoSpy).toHaveBeenCalledWith("broadcast_success", {
      event: {
        status: "success",
        appVersion: "1.0.0",
        currencyId: "bitcoin",
        family: "family",
        isTestnet: false,
        isSendMax: true,
        source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: true } },
      },
    });
  });

  it("sends only allowlisted, sanitized attributes on failure event", () => {
    const errorSpy = jest.spyOn(DdLogs, "error");
    const error = Object.assign(new Error("tx broadcast failed for 0xdeadbeef"), {
      stack: "Error: tx broadcast failed for 0xdeadbeef\n    at test:1:1",
      transactionId: 0,
      payload: "0x123456789",
      transaction: { data: "0x123456789" },
    });

    broadcastLogger({
      status: "failure",
      error,
      appVersion: "1.0.0",
      currencyId: "ethereum",
      family: "family",
      isTestnet: false,
      isSendMax: false,
      source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: false } },
      // @ts-expect-error a field outside the allowlist must not reach Datadog
      txPayload: { signature: "signature" },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "broadcast_failure",
      "Error",
      "tx broadcast failed for [id]",
      "Error: tx broadcast failed for [id]\n    at test:1:1",
      {
        errorContext: {
          transactionId: 0,
          payload: "[id]",
        },
        event: {
          status: "failure",
          appVersion: "1.0.0",
          currencyId: "ethereum",
          family: "family",
          isTestnet: false,
          isSendMax: false,
          source: {
            type: "coin-module",
            name: "ledger-live-mobile",
            flags: { newSendFlow: false },
          },
        },
      },
    );
    expect(errorSpy.mock.calls[0][4]).not.toHaveProperty("event.txPayload");
  });
});

describe("coinModuleCallLogger", () => {
  const call = {
    method: "broadcast",
    network: "ripple",
    family: "xrp",
    durationMs: 12,
    status: "success" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setCoinObservabilityConfigReader(() => observabilityOn);
  });
  afterEach(() => setCoinObservabilityConfigReader(null));

  it("does nothing while the coinObservability flag is off", () => {
    setCoinObservabilityConfigReader(null);
    coinModuleCallLogger(call);
    expect(DdLogs.info).not.toHaveBeenCalled();
  });

  it("logs a transaction-path call as info", () => {
    coinModuleCallLogger(call);
    expect(DdLogs.info).toHaveBeenCalledWith("coin_module_call", {
      coinModule: { ...call, tier: "transaction", sampleRate: 1, inSample: true },
    });
  });

  it("logs a failure as error, even on the sync path, marked outside the sample", () => {
    // The session draw is kept by the module-level transmitter: pin it outside the sample.
    const random = jest.spyOn(Math, "random").mockReturnValue(0.99);
    const failure = { ...call, method: "getBalance", status: "failure" as const };
    coinModuleCallLogger(failure);
    expect(DdLogs.error).toHaveBeenCalledWith("coin_module_call", {
      coinModule: {
        ...failure,
        tier: "sync",
        sampleRate: observabilityOn.syncPathSampleRate,
        inSample: false,
      },
    });
    random.mockRestore();
  });

  it("drops a sync-path success outside the sample", () => {
    const random = jest.spyOn(Math, "random").mockReturnValue(0.99);
    coinModuleCallLogger({ ...call, method: "getBalance" });
    expect(DdLogs.info).not.toHaveBeenCalled();
    random.mockRestore();
  });
});

describe("transactionBroadcastLogger", () => {
  const common = {
    appVersion: "1.0.0",
    pathway: TransactionPathway.Dapp,
    manifestId: "some-dapp",
    currencyId: "ethereum",
    family: "evm",
    currencyTicker: "ETH",
    isTestnet: false,
    isSendMax: false,
    dataSource: TransactionDataSource.Broadcast,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setCoinObservabilityConfigReader(() => observabilityOn);
  });
  afterEach(() => setCoinObservabilityConfigReader(null));

  it("does nothing while the coinObservability flag is off", () => {
    setCoinObservabilityConfigReader(null);
    transactionBroadcastLogger({ status: "success", stage: TransactionStage.Broadcast, ...common });
    expect(DdLogs.info).not.toHaveBeenCalled();
  });

  it("logs a broadcast success from any route", () => {
    transactionBroadcastLogger({ status: "success", stage: TransactionStage.Broadcast, ...common });
    expect(DdLogs.info).toHaveBeenCalledWith(
      "tx_broadcast",
      expect.objectContaining({
        broadcast: expect.objectContaining({ family: "evm", manifest_id: "some-dapp" }),
      }),
    );
  });

  it("logs a broadcast failure with its sanitized message, never the signed payload", () => {
    const rawTx = "0x02f8b1" + "ab".repeat(120);
    const error = Object.assign(new Error(`rejected ${rawTx}: nonce too low`), {
      name: "NonceTooLow",
    });
    transactionBroadcastLogger({
      status: "failure",
      stage: TransactionStage.Broadcast,
      error,
      errorCategory: ErrorCategory.Blockchain,
      txPayload: { signature: "0xSIGNED" },
      ...common,
    });
    expect(DdLogs.error).toHaveBeenCalledWith("tx_broadcast", {
      broadcast: expect.objectContaining({
        error_name: "NonceTooLow",
        error_message: "rejected [id]: nonce too low",
        error_category: ErrorCategory.Blockchain,
      }),
    });
    // Every argument handed to the SDK, not only the context.
    const sent = JSON.stringify(jest.mocked(DdLogs.error).mock.calls[0]);
    expect(sent).not.toContain(rawTx);
    expect(sent).not.toContain("0xSIGNED");
  });

  it("ignores sign-stage events", () => {
    transactionBroadcastLogger({ status: "intent", stage: TransactionStage.Sign, ...common });
    expect(DdLogs.info).not.toHaveBeenCalled();
  });
});

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

describe("under the Datadog SDK resource tracking", () => {
  const sdkRoot = path.dirname(require.resolve("@datadog/mobile-react-native/package.json"));
  const requireSdk = (file: string) => jest.requireActual(path.join(sdkRoot, "lib/commonjs", file));
  const requestProxy = "rum/instrumentation/resourceTracking/requestProxy";
  const { XHRProxy } = requireSdk(`${requestProxy}/XHRProxy/XHRProxy.js`);
  const { ResourceReporter } = requireSdk(`${requestProxy}/common/ResourceReporter.js`);
  const { DdRum } = requireSdk("rum/DdRum.js");
  const { BufferSingleton } = requireSdk("sdk/DatadogProvider/Buffer/BufferSingleton.js");

  const DROP_RESOURCE = "_dd.resource.drop_resource";
  const nativeRum = { startResource: jest.fn(), stopResource: jest.fn() };
  const sdkNativeRum = DdRum.nativeRum;

  beforeAll(() => {
    DdRum.nativeRum = nativeRum;
    DdRum.registerResourceEventMapper(customResourceEventMapper);
    BufferSingleton.onInitialization();
  });

  beforeEach(() => {
    nativeRum.startResource.mockClear();
    nativeRum.stopResource.mockClear();
  });

  afterAll(() => {
    BufferSingleton.reset();
    DdRum.unregisterResourceEventMapper();
    DdRum.nativeRum = sdkNativeRum;
  });

  const trackRequest = async (RequestType: typeof FakeRequest) => {
    const tracking = new XHRProxy({
      xhrType: RequestType,
      resourceReporter: new ResourceReporter([]),
    });
    tracking.onTrackingStart({ tracingSamplingRate: 0, firstPartyHostsRegexMap: [] });
    const request = new RequestType();
    request.open("GET", ADDRESS_URL);
    request.send();
    request.complete(200);
    await jest.runAllTimersAsync();
    tracking.onTrackingStop();
    return request;
  };

  it("sends the scrubbed URL to the native SDK and keeps the resource", async () => {
    const RequestType = createRequestType();
    installOn(RequestType);

    const request = await trackRequest(RequestType);

    expect(request.openedUrl).toBe(ADDRESS_URL);
    expect(nativeRum.startResource).toHaveBeenCalledWith(
      expect.any(String),
      "GET",
      SCRUBBED_URL,
      expect.anything(),
      expect.any(Number),
    );
    expect(nativeRum.stopResource).toHaveBeenCalledTimes(1);
    expect(nativeRum.stopResource.mock.calls[0][4]).not.toHaveProperty([DROP_RESOURCE]);
  });

  it("drops a resource whose URL was not scrubbed", async () => {
    await trackRequest(createRequestType());

    expect(nativeRum.stopResource).toHaveBeenCalledWith(
      expect.any(String),
      200,
      "xhr",
      expect.any(Number),
      { [DROP_RESOURCE]: true },
      expect.any(Number),
    );
  });
});
