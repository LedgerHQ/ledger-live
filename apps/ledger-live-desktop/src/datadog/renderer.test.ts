import type { Store } from "redux";
import type { State } from "~/renderer/reducers";
import {
  isDatadogAvailable,
  initDatadog,
  captureException,
  addBreadcrumb,
  setTags,
  setUser,
} from "./renderer";

jest.mock("./config", () => ({
  getDatadogBuildConfig: jest.fn(),
  buildBeforeSend: jest.fn(() => () => true),
}));

jest.mock("~/support/os", () => ({
  getOperatingSystemSupportStatus: jest.fn(() => ({ supported: true })),
}));

jest.mock("@datadog/browser-rum", () => ({
  datadogRum: {
    init: jest.fn(),
    startView: jest.fn(),
    addError: jest.fn(),
    addAction: jest.fn(),
    setGlobalContext: jest.fn(),
    setGlobalContextProperty: jest.fn(),
    setUser: jest.fn(),
  },
}));

jest.mock("electron", () => ({
  ipcRenderer: { on: jest.fn() },
}));

const mockDatadogIdSelector = jest.fn();
const mockIsDummyDatadogId = jest.fn();
jest.mock("@ledgerhq/client-ids/store", () => ({
  datadogIdSelector: (state: unknown) => mockDatadogIdSelector(state),
  isDummyDatadogId: (id: unknown) => mockIsDummyDatadogId(id),
}));

function createMockStore(overrides?: { isDummy?: boolean; rumId?: string }) {
  const rumId = overrides?.rumId ?? "test-dd-id";
  const isDummy = overrides?.isDummy ?? false;
  const mockDatadogId = {
    exportDatadogIdForRumUser: () => rumId,
    equals: () => false,
  };
  mockDatadogIdSelector.mockReturnValue(mockDatadogId);
  mockIsDummyDatadogId.mockReturnValue(isDummy);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- mock store for initDatadog(store)
  return { getState: () => ({ identities: {} }) } as unknown as Store<State>;
}

const getDatadogBuildConfig = jest.mocked(jest.requireMock("./config").getDatadogBuildConfig);
const getOperatingSystemSupportStatus = jest.mocked(
  jest.requireMock("~/support/os").getOperatingSystemSupportStatus,
);
const datadogRum = jest.requireMock("@datadog/browser-rum").datadogRum;

describe("datadog renderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOperatingSystemSupportStatus.mockReturnValue({ supported: true });
  });

  describe("isDatadogAvailable", () => {
    it("should return false when applicationId is missing", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: null,
        env: null,
      });
      expect(isDatadogAvailable()).toBe(false);
    });

    it("should return false when clientToken is missing", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: null,
        site: null,
        env: null,
      });
      expect(isDatadogAvailable()).toBe(false);
    });

    it("should return false when OS is not supported", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: "token",
        site: null,
        env: null,
      });
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      expect(isDatadogAvailable()).toBe(false);
    });

    it("should return true when config and OS are valid", () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: "token",
        site: null,
        env: null,
      });
      expect(isDatadogAvailable()).toBe(true);
    });
  });

  describe("captureException", () => {
    it("should not call datadogRum.addError when not initialized", () => {
      captureException(new Error("test"));
      expect(datadogRum.addError).not.toHaveBeenCalled();
    });
  });

  describe("addBreadcrumb", () => {
    it("should not call datadogRum.addAction when not initialized", () => {
      addBreadcrumb({ message: "test", category: "track" });
      expect(datadogRum.addAction).not.toHaveBeenCalled();
    });
  });

  describe("setTags", () => {
    it("should not call datadogRum.setGlobalContextProperty when not initialized", () => {
      setTags({ foo: "bar" });
      expect(datadogRum.setGlobalContextProperty).not.toHaveBeenCalled();
    });
  });

  describe("setUser", () => {
    it("should not call datadogRum.setUser when not initialized", () => {
      setUser("user-123");
      expect(datadogRum.setUser).not.toHaveBeenCalled();
    });
  });

  describe("initDatadog failure paths", () => {
    it("should return false when shouldSend() is false", async () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: "token",
        site: "datadoghq.eu",
        env: null,
      });
      const result = await initDatadog(() => false, undefined, createMockStore());
      expect(result).toBe(false);
      expect(datadogRum.init).not.toHaveBeenCalled();
    });

    it("should return false when applicationId is missing", async () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: null,
        clientToken: "token",
        site: null,
        env: null,
      });
      const result = await initDatadog(() => true, undefined, createMockStore());
      expect(result).toBe(false);
      expect(datadogRum.init).not.toHaveBeenCalled();
    });

    it("should return false when clientToken is missing", async () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: null,
        site: null,
        env: null,
      });
      const result = await initDatadog(() => true, undefined, createMockStore());
      expect(result).toBe(false);
      expect(datadogRum.init).not.toHaveBeenCalled();
    });

    it("should return false when OS is not supported", async () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: "token",
        site: null,
        env: null,
      });
      getOperatingSystemSupportStatus.mockReturnValue({ supported: false });
      const result = await initDatadog(() => true, undefined, createMockStore());
      expect(result).toBe(false);
      expect(datadogRum.init).not.toHaveBeenCalled();
    });

    it("should return false when init throws", async () => {
      getDatadogBuildConfig.mockReturnValue({
        applicationId: "app-id",
        clientToken: "token",
        site: "datadoghq.eu",
        env: null,
      });
      datadogRum.init.mockImplementationOnce(() => {
        throw new Error("init failed");
      });
      const result = await initDatadog(() => true, undefined, createMockStore());
      expect(result).toBe(false);
    });
  });

  describe("initDatadog success and when initialized", () => {
    const defaultConfig = {
      applicationId: "app-id",
      clientToken: "token",
      site: "datadoghq.eu",
      env: "production",
    };

    beforeEach(() => {
      getDatadogBuildConfig.mockReturnValue(defaultConfig);
      getOperatingSystemSupportStatus.mockReturnValue({ supported: true });
    });

    it("should init RUM, startView, set global context and set user from store datadogId", async () => {
      const store = createMockStore();
      const result = await initDatadog(() => true, undefined, store);
      expect(result).toBe(true);
      expect(datadogRum.init).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: "app-id",
          clientToken: "token",
          site: "datadoghq.eu",
          service: "ledger-live-desktop",
          trackViewsManually: true,
        }),
      );
      expect(datadogRum.startView).toHaveBeenCalledWith("main");
      expect(datadogRum.setGlobalContext).toHaveBeenCalled();
      expect(datadogRum.setUser).toHaveBeenCalledWith({ id: "test-dd-id" });
    });

    it("should not call setUser when store has dummy datadogId", async () => {
      createMockStore({ isDummy: true });
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- minimal store mock
      const store = { getState: () => ({ identities: {} }) } as unknown as Store<State>;
      await new Promise<void>((resolve, reject) => {
        jest.isolateModules(() => {
          getDatadogBuildConfig.mockReturnValue(defaultConfig);
          getOperatingSystemSupportStatus.mockReturnValue({ supported: true });
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs require
          const renderer = require("./renderer");
          renderer
            .initDatadog(() => true, undefined, store)
            .then((result: boolean) => {
              expect(result).toBe(true);
              expect(datadogRum.setUser).not.toHaveBeenCalled();
              resolve();
            })
            .catch(reject);
        });
      });
    });

    it("when already initialized should return true without re-calling init", async () => {
      await initDatadog(() => true, undefined, createMockStore());
      datadogRum.init.mockClear();
      const result = await initDatadog(() => true, undefined, createMockStore());
      expect(result).toBe(true);
      expect(datadogRum.init).not.toHaveBeenCalled();
    });

    it("captureException should call addError when initialized", () => {
      captureException(new Error("test error"));
      expect(datadogRum.addError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "test error" }),
      );
    });

    it("captureException should not throw when addError throws", () => {
      datadogRum.addError.mockImplementationOnce(() => {
        throw new Error("sdk error");
      });
      expect(() => captureException(new Error("e"))).not.toThrow();
    });

    it("addBreadcrumb should strip sessionId for track category when initialized", () => {
      addBreadcrumb({
        message: "click",
        category: "track",
        data: { sessionId: "s1", foo: "bar" },
      });
      expect(datadogRum.addAction).toHaveBeenCalledWith("click", {
        context: { sessionId: undefined, foo: "bar" },
      });
    });

    it("addBreadcrumb should keep data for non-track category when initialized", () => {
      addBreadcrumb({ message: "nav", category: "navigation", data: { path: "/" } });
      expect(datadogRum.addAction).toHaveBeenCalledWith("nav", {
        context: { path: "/" },
      });
    });

    it("addBreadcrumb should not throw when addAction throws", () => {
      datadogRum.addAction.mockImplementationOnce(() => {
        throw new Error("sdk error");
      });
      expect(() => addBreadcrumb({ message: "x", category: "track", data: {} })).not.toThrow();
    });

    it("setTags should call setGlobalContextProperty for each tag when initialized", () => {
      setTags({ env: "staging", count: 1 });
      expect(datadogRum.setGlobalContextProperty).toHaveBeenCalledWith("env", "staging");
      expect(datadogRum.setGlobalContextProperty).toHaveBeenCalledWith("count", 1);
    });

    it("setTags should skip undefined values", () => {
      setTags({ a: "b", skip: undefined });
      expect(datadogRum.setGlobalContextProperty).toHaveBeenCalledTimes(1);
      expect(datadogRum.setGlobalContextProperty).toHaveBeenCalledWith("a", "b");
    });

    it("setTags should not throw when setGlobalContextProperty throws", () => {
      datadogRum.setGlobalContextProperty.mockImplementationOnce(() => {
        throw new Error("sdk error");
      });
      expect(() => setTags({ a: "b" })).not.toThrow();
    });

    it("setUser should call datadogRum.setUser when initialized", () => {
      setUser("user-456");
      expect(datadogRum.setUser).toHaveBeenCalledWith({ id: "user-456" });
    });

    it("setUser should not throw when setUser throws", () => {
      datadogRum.setUser.mockImplementationOnce(() => {
        throw new Error("sdk error");
      });
      expect(() => setUser("id")).not.toThrow();
    });
  });
});
