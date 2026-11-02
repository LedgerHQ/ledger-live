import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  ErrorCategory,
} from "@ledgerhq/transaction-observability";
import { setCoinObservabilityConfigReader } from "@features/platform-coin-observability";
import {
  __resetDatadogLogsForTesting,
  broadcastLogger,
  coinModuleCallLogger,
  initDatadogLogs,
  isDatadogLogsAvailable,
  transactionBroadcastLogger,
} from "./logs";

jest.mock("./config", () => ({
  getDatadogBuildConfig: jest.fn(),
  buildBeforeSend: jest.fn(() => () => true),
}));

jest.mock("~/support/os", () => ({
  getOperatingSystemSupportStatus: jest.fn(() => ({ supported: true })),
}));

jest.mock("@datadog/browser-logs", () => ({
  datadogLogs: {
    init: jest.fn(),
    setGlobalContext: jest.fn(),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

const getDatadogBuildConfig = jest.mocked(jest.requireMock("./config").getDatadogBuildConfig);
const getOperatingSystemSupportStatus = jest.mocked(
  jest.requireMock("~/support/os").getOperatingSystemSupportStatus,
);
const datadogLogs = jest.requireMock("@datadog/browser-logs").datadogLogs;
const observabilityOn = { includeSyncPath: true, syncPathSampleRate: 0.1, maxFailuresPerKey: 5 };

describe("datadog logs", () => {
  beforeEach(() => {
    __resetDatadogLogsForTesting();
    jest.clearAllMocks();
    getOperatingSystemSupportStatus.mockReturnValue({ supported: true });
  });

  describe("isDatadogLogsAvailable", () => {
    it("should return false when clientToken is missing", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: null,
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
      expect(isDatadogLogsAvailable()).toBe(false);
    });

    it("should return false when OS is not supported", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      expect(isDatadogLogsAvailable()).toBe(false);
    });

    it("should return true when clientToken is set and OS is supported", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
      expect(isDatadogLogsAvailable()).toBe(true);
    });
  });

  describe("initDatadogLogs failure paths", () => {
    it("should return false when shouldSend() is false", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
      expect(initDatadogLogs(() => false)).toBe(false);
      expect(datadogLogs.init).not.toHaveBeenCalled();
    });

    it("should return false when clientToken is missing", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: null,
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
      expect(initDatadogLogs(() => true)).toBe(false);
      expect(datadogLogs.init).not.toHaveBeenCalled();
    });

    it("should return false when OS is not supported", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      expect(initDatadogLogs(() => true)).toBe(false);
      expect(datadogLogs.init).not.toHaveBeenCalled();
    });

    it("should return false when init throws", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
      datadogLogs.init.mockImplementationOnce(() => {
        throw new Error("init failed");
      });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      expect(initDatadogLogs(() => true)).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe("initDatadogLogs success and when initialized", () => {
    beforeEach(() => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        service: "ledger-live-desktop",
        env: "production",
      });
    });

    it("should init Logs with config values and set global context", () => {
      const result = initDatadogLogs(() => true);
      expect(result).toBe(true);
      expect(datadogLogs.init).toHaveBeenCalledWith(
        expect.objectContaining({
          clientToken: "token",
          site: "datadoghq.eu",
          service: "ledger-live-desktop",
          env: "production",
          forwardErrorsToLogs: false,
        }),
      );
      expect(datadogLogs.setGlobalContext).toHaveBeenCalledWith(
        expect.objectContaining({ git_commit: expect.any(String) }),
      );
    });

    it("should return true and skip re-init when already initialized", () => {
      initDatadogLogs(() => true);
      datadogLogs.init.mockClear();
      expect(initDatadogLogs(() => true)).toBe(true);
      expect(datadogLogs.init).not.toHaveBeenCalled();
    });
  });

  describe("broadcastLogger", () => {
    beforeEach(() => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        env: "production",
      });
      initDatadogLogs(() => true);
    });

    it("calls datadogLogs.logger.info with correct parameters on success event", () => {
      broadcastLogger({
        status: "success",
        appVersion: "1.0.0",
        currencyId: "bitcoin",
        family: "bitcoin",
        isTestnet: false,
        isSendMax: true,
        source: { type: "coin-module", name: "ledger-live-desktop", flags: { newSendFlow: true } },
      });

      expect(datadogLogs.logger.info).toHaveBeenCalledWith("broadcast_success", {
        event: {
          status: "success",
          appVersion: "1.0.0",
          currencyId: "bitcoin",
          family: "bitcoin",
          isTestnet: false,
          isSendMax: true,
          source: {
            type: "coin-module",
            name: "ledger-live-desktop",
            flags: { newSendFlow: true },
          },
        },
      });
    });

    it("sends only allowlisted, sanitized attributes on failure event", () => {
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
        family: "evm",
        isTestnet: false,
        isSendMax: false,
        source: { type: "coin-module", name: "ledger-live-desktop", flags: { newSendFlow: false } },
        // @ts-expect-error a field outside the allowlist must not reach Datadog
        txPayload: { signature: "signature" },
      });

      expect(datadogLogs.logger.error).toHaveBeenCalledWith(
        "broadcast_failure",
        {
          event: {
            status: "failure",
            appVersion: "1.0.0",
            currencyId: "ethereum",
            family: "evm",
            isTestnet: false,
            isSendMax: false,
            source: {
              type: "coin-module",
              name: "ledger-live-desktop",
              flags: { newSendFlow: false },
            },
          },
          errorContext: {
            transactionId: 0,
            payload: "[id]",
          },
        },
        expect.objectContaining({
          name: "Error",
          message: "tx broadcast failed for [id]",
          stack: "Error: tx broadcast failed for [id]\n    at test:1:1",
        }),
      );
      expect(datadogLogs.logger.error.mock.calls[0][1]).not.toHaveProperty("event.txPayload");
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

    beforeEach(() => setCoinObservabilityConfigReader(() => observabilityOn));
    afterEach(() => setCoinObservabilityConfigReader(null));

    it("does nothing while the coinObservability flag is off", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        env: "production",
      });
      initDatadogLogs(() => true);
      setCoinObservabilityConfigReader(null);
      coinModuleCallLogger(call);
      expect(datadogLogs.logger.info).not.toHaveBeenCalled();
    });

    it("does nothing before Datadog logs are initialised", () => {
      coinModuleCallLogger(call);
      expect(datadogLogs.logger.info).not.toHaveBeenCalled();
    });

    describe("once initialised", () => {
      beforeEach(() => {
        getDatadogBuildConfig.mockReturnValue({
          applicationId: null,
          clientToken: "token",
          site: "datadoghq.eu",
          env: "production",
        });
        initDatadogLogs(() => true);
      });

      it("logs a transaction-path call as info", () => {
        coinModuleCallLogger(call);
        expect(datadogLogs.logger.info).toHaveBeenCalledWith("coin_module_call", {
          coinModule: call,
        });
      });

      it("logs a failure as error, even on the sync path", () => {
        const failure = { ...call, method: "getBalance", status: "failure" as const };
        coinModuleCallLogger(failure);
        expect(datadogLogs.logger.error).toHaveBeenCalledWith("coin_module_call", {
          coinModule: failure,
        });
      });

      it("drops a sync-path success outside the sample", () => {
        const random = jest.spyOn(Math, "random").mockReturnValue(0.99);
        coinModuleCallLogger({ ...call, method: "getBalance" });
        expect(datadogLogs.logger.info).not.toHaveBeenCalled();
        random.mockRestore();
      });
    });
  });

  describe("transactionBroadcastLogger", () => {
    const common = {
      appVersion: "1.0.0",
      pathway: TransactionPathway.WalletApiSignAndBroadcast,
      manifestId: "some-live-app",
      currencyId: "ethereum",
      family: "evm",
      currencyTicker: "ETH",
      isTestnet: false,
      isSendMax: false,
      dataSource: TransactionDataSource.Broadcast,
    };

    beforeEach(() => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: "datadoghq.eu",
        env: "production",
      });
      initDatadogLogs(() => true);
      setCoinObservabilityConfigReader(() => observabilityOn);
    });
    afterEach(() => setCoinObservabilityConfigReader(null));

    it("does nothing while the coinObservability flag is off", () => {
      setCoinObservabilityConfigReader(null);
      transactionBroadcastLogger({
        status: "success",
        stage: TransactionStage.Broadcast,
        ...common,
      });
      expect(datadogLogs.logger.info).not.toHaveBeenCalled();
    });

    it("logs a broadcast success from any route", () => {
      transactionBroadcastLogger({
        status: "success",
        stage: TransactionStage.Broadcast,
        ...common,
      });
      expect(datadogLogs.logger.info).toHaveBeenCalledWith(
        "tx_broadcast",
        expect.objectContaining({
          broadcast: expect.objectContaining({ family: "evm", manifest_id: "some-live-app" }),
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
      expect(datadogLogs.logger.error).toHaveBeenCalledWith("tx_broadcast", {
        broadcast: expect.objectContaining({
          error_name: "NonceTooLow",
          error_message: "rejected [id]: nonce too low",
          error_category: ErrorCategory.Blockchain,
        }),
      });
      // Every argument handed to the SDK: no `Error` object, so no raw message or stack.
      const sent = datadogLogs.logger.error.mock.calls[0];
      expect(sent).toHaveLength(2);
      expect(JSON.stringify(sent)).not.toContain(rawTx);
      expect(JSON.stringify(sent)).not.toContain("0xSIGNED");
    });

    it("ignores sign-stage events", () => {
      transactionBroadcastLogger({ status: "intent", stage: TransactionStage.Sign, ...common });
      expect(datadogLogs.logger.info).not.toHaveBeenCalled();
    });
  });
});
