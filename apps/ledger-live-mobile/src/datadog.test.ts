import { DdLogs } from "@datadog/mobile-react-native";
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
  transactionBroadcastLogger,
} from "./datadog";
import { setCoinObservabilityConfigReader } from "@features/platform-coin-observability";

const observabilityOn = { includeSyncPath: true, syncPathSampleRate: 0.1, maxFailuresPerKey: 5 };

jest.mock("@datadog/mobile-react-native", () => ({
  DdLogs: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  TrackingConsent: {},
  DatadogProvider: { initialize: jest.fn() },
}));

jest.mock("@datadog/mobile-react-navigation", () => ({}));
jest.mock("./const", () => ({ ScreenName: {} }));
jest.mock("./utils/datadogUtils", () => ({ buildFeatureFlagTags: jest.fn(() => ({})) }));

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
    expect(DdLogs.info).toHaveBeenCalledWith("coin_module_call", { coinModule: call });
  });

  it("logs a failure as error, even on the sync path", () => {
    const failure = { ...call, method: "getBalance", status: "failure" as const };
    coinModuleCallLogger(failure);
    expect(DdLogs.error).toHaveBeenCalledWith("coin_module_call", { coinModule: failure });
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
