import {
  __resetDatadogLogsForTesting,
  broadcastLogger,
  initDatadogLogs,
  isDatadogLogsAvailable,
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
      error: jest.fn(),
    },
  },
}));

const getDatadogBuildConfig = jest.mocked(jest.requireMock("./config").getDatadogBuildConfig);
const getOperatingSystemSupportStatus = jest.mocked(
  jest.requireMock("~/support/os").getOperatingSystemSupportStatus,
);
const datadogLogs = jest.requireMock("@datadog/browser-logs").datadogLogs;

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
      });

      expect(datadogLogs.logger.info).toHaveBeenCalledWith("broadcast_success", {
        event: {
          status: "success",
          appVersion: "1.0.0",
          currencyId: "bitcoin",
          family: "bitcoin",
        },
      });
    });

    it("calls datadogLogs.logger.error with correct parameters on failure event", () => {
      const error = new Error("tx broadcast failed");
      error.stack = "Error: tx broadcast failed\n  at test:1:1";

      broadcastLogger({
        status: "failure",
        error,
        txPayload: { signature: "signature" },
        appVersion: "1.0.0",
        currencyId: "ethereum",
        family: "evm",
      });

      expect(datadogLogs.logger.error).toHaveBeenCalledWith(
        "broadcast_failure",
        {
          event: {
            status: "failure",
            txPayload: { signature: "signature" },
            appVersion: "1.0.0",
            currencyId: "ethereum",
            family: "evm",
          },
        },
        error,
      );
    });
  });
});
