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
  customActionEventMapper,
  customErrorEventMapper,
  customLogEventMapper,
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

  it("redacts account descriptors from the message, stack and context", () => {
    const descriptor =
      "account:2:address:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0";
    const event = {
      message: `Read failed for ${descriptor}`,
      stacktrace: `Error: ${descriptor}`,
      context: { account: { descriptors: [descriptor] }, count: 1 },
    } as Parameters<typeof mapError>[0];

    const mapped = mapError(event);
    expect(JSON.stringify(mapped)).not.toContain("0x71C7");
    expect(mapped).toEqual(
      expect.objectContaining({
        message: "Read failed for [redacted]",
        stacktrace: "Error: [redacted]",
        context: { account: { descriptors: ["[redacted]"] }, count: 1, featureFlags: {} },
      }),
    );
  });
});

describe("account descriptor redaction", () => {
  const descriptor =
    "account:2:address:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0";
  const mapError = customErrorEventMapper(false);

  it("drops an error event whose context cannot be read, rather than sending it as is", () => {
    const context = {
      get broken(): string {
        throw new Error(descriptor);
      },
    };
    const event = { message: descriptor, stacktrace: "", context } as Parameters<
      typeof mapError
    >[0];
    expect(mapError(event)).toBeNull();
  });

  it("redacts a cyclic context and an event without a stack", () => {
    const context: Record<string, unknown> = { descriptor };
    context.self = context;
    const event = { message: descriptor, context } as Parameters<typeof mapError>[0];
    const mapped = mapError(event);
    expect(mapped).toEqual(
      expect.objectContaining({
        message: "[redacted]",
        stacktrace: undefined,
        context: { descriptor: "[redacted]", self: "[circular]", featureFlags: {} },
      }),
    );
  });

  it("sends errors as name and message, and dates as JSON, in the context", () => {
    const at = new Date(0);
    const event = {
      message: "m",
      stacktrace: "",
      context: { cause: new Error(`timeout for ${descriptor}`), at },
    } as Parameters<typeof mapError>[0];
    expect(mapError(event)?.context).toEqual(
      expect.objectContaining({
        cause: { name: "Error", message: "timeout for [redacted]" },
        at: at.toJSON(),
      }),
    );
  });

  it("redacts log events: message, error fields and context", () => {
    const event = {
      message: `sync ${descriptor}`,
      errorKind: `SyncError ${descriptor}`,
      errorMessage: descriptor,
      stacktrace: `Error: ${descriptor}`,
      context: { descriptor },
      status: "error",
    } as Parameters<typeof customLogEventMapper>[0];
    const mapped = customLogEventMapper(event);
    expect(JSON.stringify(mapped)).not.toContain("0x71C7");
    expect(mapped?.errorKind).toBe("SyncError [redacted]");
  });

  it("redacts action event contexts", () => {
    const event = {
      type: "TAP",
      name: "Add",
      context: { descriptor },
      timestampMs: 0,
    } as Parameters<typeof customActionEventMapper>[0];
    const mapped = customActionEventMapper(event);
    expect(JSON.stringify(mapped)).not.toContain("0x71C7");
  });

  it("drops an action whose name holds a descriptor, as the SDK restores the name", () => {
    const event = {
      type: "TAP",
      name: `Open ${descriptor}`,
      context: {},
      timestampMs: 0,
    } as Parameters<typeof customActionEventMapper>[0];
    expect(customActionEventMapper(event)).toBeNull();
  });

  it("drops a log event whose context cannot be read, rather than sending it as is", () => {
    const context = {
      get broken(): string {
        throw new Error(descriptor);
      },
    };
    const event = { message: "m", context } as Parameters<typeof customLogEventMapper>[0];
    expect(customLogEventMapper(event)).toBeNull();
  });

  it("drops an action event whose context cannot be read, rather than sending it as is", () => {
    const context = {
      get broken(): string {
        throw new Error(descriptor);
      },
    };
    const event = {
      type: "TAP",
      name: "Add",
      context,
      timestampMs: 0,
    } as Parameters<typeof customActionEventMapper>[0];
    expect(customActionEventMapper(event)).toBeNull();
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
