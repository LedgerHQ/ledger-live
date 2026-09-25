import { DatadogId } from "@domain/entity-client-identity";
import {
  __resetDatadogMainForTesting,
  captureExceptionMain,
  initDatadogMain,
  isDatadogMainAvailable,
  setGlobalContextMain,
  setUserIdMain,
} from "./main";

jest.mock("@datadog/electron-sdk", () => ({
  init: jest.fn(),
  addError: jest.fn(),
  setUserInfo: jest.fn(),
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

jest.mock("~/datadog/anonymizer", () => ({
  __esModule: true,
  default: {
    filepath: jest.fn((s: string) => s.replaceAll("/Users/john", "$HOME")),
  },
}));

const { init, addError, setUserInfo } = jest.requireMock("@datadog/electron-sdk");
const getDatadogBuildConfig = jest.mocked(jest.requireMock("./config").getDatadogBuildConfig);
const shouldIgnoreErrorMessage = jest.mocked(
  jest.requireMock("./ignoreErrors").shouldIgnoreErrorMessage,
);
const getOperatingSystemSupportStatus = jest.mocked(
  jest.requireMock("~/support/os").getOperatingSystemSupportStatus,
);

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
      expect(await initDatadogMain(() => true)).toBe(false);
    });
  });

  describe("initDatadogMain success", () => {
    beforeEach(() => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
    });

    it("inits the SDK with config values and a file:// renderer allowlist", async () => {
      expect(await initDatadogMain(() => true, { usr_id: "id" })).toBe(true);
      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: "app",
          clientToken: "token",
          site: "datadoghq.eu",
          service: "ledger-live-desktop",
          env: "production",
          allowedRendererHosts: ["file://"],
        }),
      );
    });

    it("dedupes concurrent calls into a single init()", async () => {
      const results = await Promise.all([
        initDatadogMain(() => true),
        initDatadogMain(() => true),
        initDatadogMain(() => true),
      ]);
      expect(results).toEqual([true, true, true]);
      expect(init).toHaveBeenCalledTimes(1);
    });

    it("returns true and skips re-init when already initialized", async () => {
      await initDatadogMain(() => true);
      init.mockClear();
      expect(await initDatadogMain(() => true)).toBe(true);
      expect(init).not.toHaveBeenCalled();
    });
  });

  describe("captureExceptionMain queueing during in-flight init", () => {
    it("queues a capture that arrives while init is pending, then flushes it once init resolves", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      let resolveInit: (ok: boolean) => void = () => {};
      init.mockImplementationOnce(
        () =>
          new Promise<boolean>(resolve => {
            resolveInit = resolve;
          }),
      );
      const initP = initDatadogMain(() => true);
      captureExceptionMain(new Error("boom"));
      expect(addError).not.toHaveBeenCalled();
      resolveInit(true);
      await initP;
      expect(addError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "boom" }),
        expect.anything(),
      );
    });

    it("drops a queued capture if init ultimately fails", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      let rejectInit: (e: unknown) => void = () => {};
      init.mockImplementationOnce(
        () =>
          new Promise<boolean>((_resolve, reject) => {
            rejectInit = reject;
          }),
      );
      const initP = initDatadogMain(() => true);
      captureExceptionMain(new Error("boom"));
      rejectInit(new Error("network down"));
      await initP;
      expect(addError).not.toHaveBeenCalled();
    });
  });

  describe("captureExceptionMain", () => {
    beforeEach(async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      await initDatadogMain(() => true);
      addError.mockClear();
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
        expect.anything(),
      );
    });

    it("preserves the original error's name (e.g. TypeError) on the anonymized clone", () => {
      captureExceptionMain(new TypeError("bad type"));
      expect(addError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "TypeError" }),
        expect.anything(),
      );
    });

    it("never throws when addError itself throws (called from uncaughtException, which Node does not protect)", () => {
      addError.mockImplementationOnce(() => {
        throw new Error("addError blew up");
      });
      expect(() => captureExceptionMain(new Error("boom"))).not.toThrow();
    });

    it("rewrites asar paths and reshapes stack frames to the '@' shape Datadog unminifies", () => {
      const err = new Error("boom");
      err.stack = [
        "Error: boom",
        "    at run (/Applications/Ledger Wallet.app/Contents/Resources/app.asar/.webpack/main.bundle.js:1:2)",
      ].join("\n");
      captureExceptionMain(err);
      expect(addError).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: "Error: boom\n    at run @ https://app.asar/.webpack/main.bundle.js:1:2",
        }),
        expect.anything(),
      );
    });

    it("normalizes non-Error rejection reasons to Error before forwarding", () => {
      captureExceptionMain("raw string error at /Users/john/app");
      expect(addError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "raw string error at $HOME/app" }),
        expect.anything(),
      );
    });

    it("forwards the merged global context set via setGlobalContextMain", () => {
      setGlobalContextMain({ usr_id: "abc" });
      captureExceptionMain(new Error("boom"));
      expect(addError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ context: expect.objectContaining({ usr_id: "abc" }) }),
      );
    });
  });

  describe("setUserIdMain", () => {
    it("does nothing when not initialized", () => {
      __resetDatadogMainForTesting();
      setUserIdMain(DatadogId.fromString("datadog-id"));
      expect(setUserInfo).not.toHaveBeenCalled();
    });

    it("forwards the DatadogId to the SDK once initialized", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      await initDatadogMain(() => true);
      setUserIdMain(DatadogId.fromString("datadog-id"));
      expect(setUserInfo).toHaveBeenCalledWith({ id: "datadog-id" });
    });

    it("does nothing when shouldSend() has flipped to false after init (opt-out)", async () => {
      getDatadogBuildConfig.mockReturnValue(fullConfig);
      let shouldSend = true;
      await initDatadogMain(() => shouldSend);
      shouldSend = false;
      setUserIdMain(DatadogId.fromString("datadog-id"));
      expect(setUserInfo).not.toHaveBeenCalled();
    });
  });
});
