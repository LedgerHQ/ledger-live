import {
  isDatadogAvailableInMain,
  initDatadogMain,
  captureExceptionMain,
  sendMainErrorToRenderer,
} from "./main";

const mockSend = jest.fn();

jest.mock("~/main/window-lifecycle", () => ({
  getMainWindow: jest.fn(),
}));

jest.mock("./config", () => ({
  getDatadogBuildConfig: jest.fn(),
}));

jest.mock("./ignoreErrors", () => ({
  shouldIgnoreErrorMessage: jest.fn(() => false),
}));

jest.mock("~/support/os", () => ({
  getOperatingSystemSupportStatus: jest.fn(() => ({ supported: true })),
}));

const getMainWindow = jest.mocked(jest.requireMock("~/main/window-lifecycle").getMainWindow);
const getDatadogBuildConfig = jest.mocked(jest.requireMock("./config").getDatadogBuildConfig);
const shouldIgnoreErrorMessage = jest.mocked(
  jest.requireMock("./ignoreErrors").shouldIgnoreErrorMessage,
);
const getOperatingSystemSupportStatus = jest.mocked(
  jest.requireMock("~/support/os").getOperatingSystemSupportStatus,
);

const defaultConfig = {
  applicationId: "app-id",
  clientToken: "token",
};

describe("datadog main", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDatadogBuildConfig.mockReturnValue(defaultConfig);
    getOperatingSystemSupportStatus.mockReturnValue({ supported: true });
    shouldIgnoreErrorMessage.mockReturnValue(false);
  });

  describe("isDatadogAvailableInMain", () => {
    it("should return false when applicationId is missing", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
      });
      expect(isDatadogAvailableInMain()).toBe(false);
    });

    it("should return false when clientToken is missing", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: null,
      });
      expect(isDatadogAvailableInMain()).toBe(false);
    });

    it("should return false when OS is not supported", () => {
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      expect(isDatadogAvailableInMain()).toBe(false);
    });

    it("should return true when config and OS are valid", () => {
      expect(isDatadogAvailableInMain()).toBe(true);
    });
  });

  describe("initDatadogMain", () => {
    it("should do nothing when not available", () => {
      getDatadogBuildConfig.mockReturnValue({ applicationId: null, clientToken: "token" });
      const addListenerSpy = jest.spyOn(process, "on");
      initDatadogMain(() => true, "dd-id");
      expect(addListenerSpy).not.toHaveBeenCalled();
      addListenerSpy.mockRestore();
    });

    it("should do nothing when datadogIdFromDb is empty", () => {
      const addListenerSpy = jest.spyOn(process, "on");
      initDatadogMain(() => true, "");
      expect(addListenerSpy).not.toHaveBeenCalled();
      addListenerSpy.mockRestore();
    });

    it("should do nothing when datadogIdFromDb is not a string", () => {
      const addListenerSpy = jest.spyOn(process, "on");
      initDatadogMain(
        () => true,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- test invalid arg
        null as unknown as string,
      );
      expect(addListenerSpy).not.toHaveBeenCalled();
      addListenerSpy.mockRestore();
    });

    it("should register uncaughtException and unhandledRejection when valid", () => {
      const addListenerSpy = jest.spyOn(process, "on");
      initDatadogMain(() => true, "dd-id-from-db");
      expect(addListenerSpy).toHaveBeenCalledWith("uncaughtException", expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
      addListenerSpy.mockRestore();
    });

    it("should not register again when already initialized", () => {
      initDatadogMain(() => true, "dd-id");
      const addListenerSpy = jest.spyOn(process, "on");
      addListenerSpy.mockClear();
      initDatadogMain(() => true, "other-dd-id");
      expect(addListenerSpy).not.toHaveBeenCalled();
      addListenerSpy.mockRestore();
    });
  });

  describe("captureExceptionMain", () => {
    beforeEach(() => {
      initDatadogMain(() => true, "dd-id");
    });

    it("should do nothing when shouldSend returns false", () => {
      jest.isolateModules(() => {
        getDatadogBuildConfig.mockReturnValue(defaultConfig);
        getOperatingSystemSupportStatus.mockReturnValue({ supported: true });
        getMainWindow.mockReturnValue({
          isDestroyed: () => false,
          webContents: { send: mockSend },
        });
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs require
        const main = require("./main");
        main.initDatadogMain(() => false, "dd-id");
        main.captureExceptionMain(new Error("test"));
      });
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should do nothing when error message is in ignore list", () => {
      shouldIgnoreErrorMessage.mockReturnValue(true);
      getMainWindow.mockReturnValue({
        isDestroyed: () => false,
        webContents: { send: mockSend },
      });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      captureExceptionMain(new Error("timeout"));
      expect(mockSend).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should send to renderer when window exists", () => {
      getMainWindow.mockReturnValue({
        isDestroyed: () => false,
        webContents: { send: mockSend },
      });
      const err = new Error("MainError");
      err.stack = "at foo";
      err.name = "Error";
      captureExceptionMain(err);
      expect(mockSend).toHaveBeenCalledWith("main-error-to-datadog", {
        message: "MainError",
        stack: "at foo",
        name: "Error",
      });
    });

    it("should call console.error when no window", () => {
      getMainWindow.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      captureExceptionMain(new Error("NoWindowError"));
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Datadog main] Error (no renderer window):",
        expect.any(Error),
      );
      expect(mockSend).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("sendMainErrorToRenderer", () => {
    it("should do nothing when main window is null", () => {
      getMainWindow.mockReturnValue(null);
      sendMainErrorToRenderer(new Error("test"));
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should do nothing when window is destroyed", () => {
      getMainWindow.mockReturnValue({
        isDestroyed: () => true,
        webContents: { send: mockSend },
      });
      sendMainErrorToRenderer(new Error("test"));
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should do nothing when webContents is missing", () => {
      getMainWindow.mockReturnValue({
        isDestroyed: () => false,
        webContents: undefined,
      });
      sendMainErrorToRenderer(new Error("test"));
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should send error payload to renderer when window is valid", () => {
      getMainWindow.mockReturnValue({
        isDestroyed: () => false,
        webContents: { send: mockSend },
      });
      const err = new Error("CrashTestMain");
      err.stack = "Error: CrashTestMain\n  at foo";
      err.name = "Error";
      sendMainErrorToRenderer(err);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith("main-error-to-datadog", {
        message: "CrashTestMain",
        stack: "Error: CrashTestMain\n  at foo",
        name: "Error",
      });
    });
  });
});
