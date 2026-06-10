import {
  __resetDatadogMainForTesting,
  captureExceptionMain,
  initDatadogMain,
  installDatadogMainErrorHandlers,
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
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
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

    it("skips ignored error messages", () => {
      shouldIgnoreErrorMessage.mockReturnValue(true);
      captureExceptionMain(new Error("ignored"));
      expect(addError).not.toHaveBeenCalled();
    });

    it("forwards a sanitized copy without mutating the original error", () => {
      const err = new Error("failure at /Users/john/app");
      err.stack = "Error: failure\n  at /Users/john/app/index.js:1:1";
      captureExceptionMain(err);
      // the original error is left untouched (other reporters/console may still observe it)
      expect(err.message).toBe("failure at /Users/john/app");
      expect(err.stack).toBe("Error: failure\n  at /Users/john/app/index.js:1:1");
      // a sanitized copy is forwarded to Datadog
      const [sent, options] = addError.mock.calls[0];
      expect(sent).not.toBe(err);
      expect(sent.message).toBe("failure at $HOME/app");
      expect(sent.stack).toBe("Error: failure\n  at <anonymous> @ $HOME/app/index.js:1:1");
      expect(options).toEqual(expect.objectContaining({ context: expect.any(Object) }));
    });

    it("rewrites raw asar bundle paths and reformats frames to the Datadog @ shape", () => {
      const err = new Error("CrashTestMain");
      err.stack = [
        "Error: CrashTestMain",
        "    at IpcMainImpl.<anonymous> (/Applications/Ledger Wallet Beta.app/Contents/Resources/app.asar/.webpack/main.bundle.js:82:104341)",
        "    at /Applications/Ledger Wallet Beta.app/Contents/Resources/app.asar/node_modules/dd-trace/packages/datadog-instrumentations/src/electron.js:73:47",
        "    at node:diagnostics_channel:374:23",
        "    at IpcMainImpl.emit (node:events:508:28)",
      ].join("\n");
      captureExceptionMain(err);
      const sent = addError.mock.calls[0][0];
      // our webpack bundle frame: https://app.asar path + "@" syntax => Datadog unminifies it
      expect(sent.stack).toContain(
        "at IpcMainImpl.<anonymous> @ https://app.asar/.webpack/main.bundle.js:82:104341",
      );
      // third-party asar frames also drop the local prefix (no map, won't resolve) and use @ syntax
      expect(sent.stack).toContain(
        "at <anonymous> @ https://app.asar/node_modules/dd-trace/packages/datadog-instrumentations/src/electron.js:73:47",
      );
      expect(sent.stack).toContain("at <anonymous> @ node:diagnostics_channel:374:23");
      expect(sent.stack).toContain("at IpcMainImpl.emit @ node:events:508:28");
      expect(sent.stack).toContain("Error: CrashTestMain");
      expect(sent.stack).not.toContain("(https://");
      // no local filesystem path leaks
      expect(sent.stack).not.toContain("/Applications/");
    });

    it("rewrites asar frames even when the app is installed under the home dir", () => {
      const err = new Error("CrashTestMain");
      err.stack =
        "Error: CrashTestMain\n    at fn (/Users/john/Applications/Ledger Wallet Beta.app/Contents/Resources/app.asar/.webpack/main.bundle.js:82:1)";
      captureExceptionMain(err);
      const sent = addError.mock.calls[0][0];
      expect(sent.stack).toContain("at fn @ https://app.asar/.webpack/main.bundle.js:82:1");
      expect(sent.stack).not.toContain("$HOME");
    });

    it("anonymizes and merges the context", () => {
      setGlobalContextMain({ process: "main" });
      captureExceptionMain(new Error("boom"), { extra: "value" });
      expect(anonymizer.filepathRecursiveReplacer).toHaveBeenCalledWith(
        expect.objectContaining({ process: "main", extra: "value" }),
      );
    });

    it("forwards non-Error values (string, object, undefined) unchanged", () => {
      captureExceptionMain("boom string");
      captureExceptionMain({ message: "obj message" });
      captureExceptionMain(undefined);
      expect(addError).toHaveBeenNthCalledWith(1, "boom string", expect.any(Object));
      expect(addError).toHaveBeenNthCalledWith(2, { message: "obj message" }, expect.any(Object));
      expect(addError).toHaveBeenNthCalledWith(3, undefined, expect.any(Object));
    });
  });

  describe("installDatadogMainErrorHandlers", () => {
    it("forwards uncaught errors and renderer crashes, skipping clean exits", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      await initDatadogMain(() => true);
      const procOn = jest.spyOn(process, "on").mockReturnValue(process);
      const appOn = jest.fn();
      installDatadogMainErrorHandlers({ on: appOn });

      const onProc = Object.fromEntries(procOn.mock.calls);
      onProc.uncaughtException(new Error("boom"));
      onProc.unhandledRejection(new Error("rejected"));
      const onRPG = appOn.mock.calls[0][1];
      onRPG({}, {}, { reason: "clean-exit" });
      onRPG({}, {}, { reason: "crashed", exitCode: 1 });

      expect(addError).toHaveBeenCalledTimes(3);
      procOn.mockRestore();
    });
  });
});
