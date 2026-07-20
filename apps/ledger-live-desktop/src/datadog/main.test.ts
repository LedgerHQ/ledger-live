import {
  __resetDatadogMainForTesting,
  captureExceptionMain,
  initDatadogMain,
  isDatadogMainAvailable,
  setGlobalContextMain,
} from "./main";

jest.mock("@datadog/electron-sdk", () => ({
  init: jest.fn(),
  addError: jest.fn(),
}));

jest.mock("./config", () => ({
  ...jest.requireActual("./config"),
  getDatadogBuildConfig: jest.fn(),
}));

jest.mock("./ignoreErrors", () => ({
  shouldIgnoreErrorMessage: jest.fn(() => false),
}));

jest.mock("~/support/os", () => ({
  getOperatingSystemSupportStatus: jest.fn(() => ({ supported: true })),
}));

jest.mock("~/sentry/anonymizer", () => ({
  __esModule: true,
  default: {
    filepath: jest.fn((s: string) => s.replaceAll("/Users/john", "$HOME")),
    filepathRecursiveReplacer: jest.fn(),
  },
}));

const { init, addError } = jest.requireMock("@datadog/electron-sdk");
const getDatadogBuildConfig = jest.mocked(jest.requireMock("./config").getDatadogBuildConfig);
const shouldIgnoreErrorMessage = jest.mocked(
  jest.requireMock("./ignoreErrors").shouldIgnoreErrorMessage,
);
const getOperatingSystemSupportStatus = jest.mocked(
  jest.requireMock("~/support/os").getOperatingSystemSupportStatus,
);
const anonymizer = jest.requireMock("~/sentry/anonymizer").default;

const fullConfig = {
  applicationId: "app",
  clientToken: "token",
  site: "datadoghq.eu",
  service: "ledger-live-desktop",
  env: "production",
};

describe("datadog main", () => {
  beforeEach(() => {
    __resetDatadogMainForTesting();
    jest.clearAllMocks();
    getOperatingSystemSupportStatus.mockReturnValue({ supported: true });
    shouldIgnoreErrorMessage.mockReturnValue(false);
    init.mockResolvedValue(true);
  });

  describe("isDatadogMainAvailable", () => {
    it("returns false when applicationId or clientToken is missing", () => {
      getDatadogBuildConfig.mockReturnValue({ ...fullConfig, applicationId: null });
      expect(isDatadogMainAvailable()).toBe(false);
    });

    it("returns false when OS is not supported", () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      expect(isDatadogMainAvailable()).toBe(false);
    });

    it("returns true when config is set and OS is supported", () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      expect(isDatadogMainAvailable()).toBe(true);
    });
  });

  describe("initDatadogMain failure paths", () => {
    it("returns false when shouldSend() is false", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      expect(await initDatadogMain(() => false)).toBe(false);
      expect(init).not.toHaveBeenCalled();
    });

    it("returns false when config is missing", async () => {
      getDatadogBuildConfig.mockReturnValue({ ...fullConfig, clientToken: null });
      expect(await initDatadogMain(() => true)).toBe(false);
      expect(init).not.toHaveBeenCalled();
    });

    it("returns false when OS is not supported", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      expect(await initDatadogMain(() => true)).toBe(false);
      expect(init).not.toHaveBeenCalled();
    });

    it("returns false when init resolves false", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      init.mockResolvedValueOnce(false);
      expect(await initDatadogMain(() => true)).toBe(false);
    });

    it("returns false when init throws", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      init.mockRejectedValueOnce(new Error("init failed"));
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      expect(await initDatadogMain(() => true)).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe("initDatadogMain success", () => {
    beforeEach(() => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
    });

    it("inits the SDK with config values", async () => {
      expect(await initDatadogMain(() => true, { usr_id: "id" })).toBe(true);
      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: "app",
          clientToken: "token",
          site: "datadoghq.eu",
          service: "ledger-live-desktop",
          env: "production",
        }),
      );
    });

    it("returns true and skips re-init when already initialized", async () => {
      await initDatadogMain(() => true);
      init.mockClear();
      expect(await initDatadogMain(() => true)).toBe(true);
      expect(init).not.toHaveBeenCalled();
    });
  });

  describe("captureExceptionMain", () => {
    beforeEach(async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      await initDatadogMain(() => true);
    });

    it("does nothing when not initialized", () => {
      __resetDatadogMainForTesting();
      captureExceptionMain(new Error("boom"));
      expect(addError).not.toHaveBeenCalled();
    });

    it("does nothing when shouldSend() is false", async () => {
      __resetDatadogMainForTesting();
      await initDatadogMain(() => false);
      captureExceptionMain(new Error("boom"));
      expect(addError).not.toHaveBeenCalled();
    });

    it("skips capture when shouldSend() flips to false after init", async () => {
      __resetDatadogMainForTesting();
      let shouldSend = true;
      await initDatadogMain(() => shouldSend);
      shouldSend = false;
      captureExceptionMain(new Error("boom"));
      expect(addError).not.toHaveBeenCalled();
    });

    it("skips ignored error messages", () => {
      shouldIgnoreErrorMessage.mockReturnValue(true);
      captureExceptionMain(new Error("ignored"));
      expect(addError).not.toHaveBeenCalled();
    });

    it("anonymizes the error message and stack before forwarding without mutating the original", () => {
      const err = new Error("failure at /Users/john/app");
      err.stack = "Error: failure\n  at /Users/john/app/index.js:1:1";
      captureExceptionMain(err);
      expect(err.message).toBe("failure at /Users/john/app");
      expect(addError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "failure at $HOME/app" }),
        expect.objectContaining({ context: expect.any(Object) }),
      );
    });

    it("normalizes non-Error unhandledRejection reasons to Error before forwarding", () => {
      captureExceptionMain("raw string error at /Users/john/app");
      expect(addError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "raw string error at $HOME/app" }),
        expect.objectContaining({ context: expect.any(Object) }),
      );
    });

    it("anonymizes and merges the context", () => {
      setGlobalContextMain({ process: "main" });
      captureExceptionMain(new Error("boom"), { extra: "value" });
      expect(anonymizer.filepathRecursiveReplacer).toHaveBeenCalledWith(
        expect.objectContaining({ process: "main", extra: "value" }),
      );
    });
  });
});
