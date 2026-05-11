import { __resetDatadogLogsForTesting, initDatadogLogs, isDatadogLogsAvailable } from "./logs";

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
        site: null,
        env: null,
      });
      expect(isDatadogLogsAvailable()).toBe(false);
    });

    it("should return false when OS is not supported", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: null,
        env: null,
      });
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      expect(isDatadogLogsAvailable()).toBe(false);
    });

    it("should return true when clientToken is set and OS is supported", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: null,
        env: null,
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
        env: "production",
      });
      expect(initDatadogLogs(() => false)).toBe(false);
      expect(datadogLogs.init).not.toHaveBeenCalled();
    });

    it("should return false when clientToken is missing", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: null,
        site: null,
        env: null,
      });
      expect(initDatadogLogs(() => true)).toBe(false);
      expect(datadogLogs.init).not.toHaveBeenCalled();
    });

    it("should return false when OS is not supported", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: null,
        env: null,
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

    it("should fall back to defaults for missing site/env", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: null,
        env: null,
      });
      initDatadogLogs(() => true);
      expect(datadogLogs.init).toHaveBeenCalledWith(
        expect.objectContaining({
          site: "datadoghq.eu",
          env: expect.any(String),
        }),
      );
    });

    it("should return true and skip re-init when already initialized", () => {
      initDatadogLogs(() => true);
      datadogLogs.init.mockClear();
      expect(initDatadogLogs(() => true)).toBe(true);
      expect(datadogLogs.init).not.toHaveBeenCalled();
    });
  });
});
