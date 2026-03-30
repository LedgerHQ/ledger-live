import { initIdentities } from "./identities";
import { getKey } from "~/renderer/storage";
import type { ReduxStore } from "~/state-manager/configureStore";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

const mockGetKey = jest.mocked(getKey);

function createMockStore(): ReduxStore {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- minimal state for identities tests
  return createStore({ state: {} as State });
}

describe("initIdentities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should dispatch initFromPersisted and return false when persisted identities exist", async () => {
    const persisted = {
      userId: "user-123",
      datadogId: "dd-456",
      deviceIds: [],
      pushDevicesSyncState: "unsynced" as const,
      pushDevicesServiceUrl: null,
    };
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return persisted;
      return undefined;
    });

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    expect(mockGetKey).toHaveBeenCalledWith("app", "identities");
    expect(mockGetKey).not.toHaveBeenCalledWith("app", "user");
    expect(store.getState().identities.userId.toString()).toBe("[UserId:REDACTED]");
    expect(store.getState().identities.userId.exportUserIdForPersistence()).toBe("user-123");
    expect(store.getState().identities.datadogId?.exportDatadogIdForPersistence()).toBe("dd-456");
  });

  it("should dispatch importFromLegacy and return false when legacy app/user has id", async () => {
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return undefined;
      if (ns === "app" && keyPath === "user")
        return { id: "legacy-user-id", datadogId: "legacy-dd-id" };
      return undefined;
    });

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    expect(mockGetKey).toHaveBeenCalledWith("app", "identities");
    expect(mockGetKey).toHaveBeenCalledWith("app", "user");
    expect(store.getState().identities.userId.exportUserIdForPersistence()).toBe("legacy-user-id");
    expect(store.getState().identities.datadogId?.exportDatadogIdForPersistence()).toBe(
      "legacy-dd-id",
    );
  });

  it("should dispatch importFromLegacy with only userId when legacy user has no datadogId", async () => {
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return undefined;
      if (ns === "app" && keyPath === "user") return { id: "legacy-only-id" };
      return undefined;
    });

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    expect(store.getState().identities.userId.exportUserIdForPersistence()).toBe("legacy-only-id");
    expect(store.getState().identities.datadogId).toBeDefined();
    expect(store.getState().identities.datadogId?.exportDatadogIdForPersistence()).not.toBe(
      "legacy-only-id",
    );
  });

  it("should dispatch importFromLegacy from localStorage userId when no persisted or legacy user", async () => {
    mockGetKey.mockImplementation(async () => undefined);
    const getItemSpy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation((key: string) => {
        if (key === "userId") return "local-storage-user-id";
        return null;
      });

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    expect(store.getState().identities.userId.exportUserIdForPersistence()).toBe(
      "local-storage-user-id",
    );
    getItemSpy.mockRestore();
  });

  it("should dispatch initFromScratch and return true when no persisted, no legacy, no localStorage", async () => {
    mockGetKey.mockImplementation(async () => undefined);
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(true);
    expect(mockGetKey).toHaveBeenCalledWith("app", "identities");
    expect(mockGetKey).toHaveBeenCalledWith("app", "user");
    const state = store.getState().identities;
    expect(state.userId).toBeDefined();
    expect(state.datadogId).toBeDefined();
    expect(state.userId.exportUserIdForPersistence()).not.toBe("");
    expect(state.datadogId?.exportDatadogIdForPersistence()).not.toBe("");
    getItemSpy.mockRestore();
  });

  it("should dispatch initFromScratch when localStorage is undefined (e.g. non-browser context)", async () => {
    mockGetKey.mockImplementation(async () => undefined);
    const origLocalStorage = global.localStorage;
    // @ts-expect-error - simulate environment without localStorage
    delete global.localStorage;

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(true);
    expect(store.getState().identities.userId.exportUserIdForPersistence()).not.toBe("");
    expect(store.getState().identities.datadogId?.exportDatadogIdForPersistence()).not.toBe("");
    global.localStorage = origLocalStorage;
  });

  it("should default pushDevicesSyncState to synced and pushDevicesServiceUrl to null when omitted in persisted", async () => {
    const minimalPersisted = {
      userId: "minimal-user",
      datadogId: "minimal-dd",
      deviceIds: [],
    };
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return minimalPersisted;
      return undefined;
    });

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    expect(store.getState().identities.pushDevicesSyncState).toBe("synced");
    expect(store.getState().identities.pushDevicesServiceUrl).toBeNull();
  });

  it("should use empty deviceIds array when persisted has non-array deviceIds", async () => {
    const malformedPersisted = {
      userId: "user-1",
      datadogId: "dd-1",
      deviceIds: "not-an-array" as unknown as string[],
      pushDevicesSyncState: "synced" as const,
      pushDevicesServiceUrl: null,
    };
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return malformedPersisted;
      return undefined;
    });

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    expect(store.getState().identities.deviceIds).toEqual([]);
  });

  it("should not use legacy user when user object is undefined (getKey returns undefined)", async () => {
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return undefined;
      if (ns === "app" && keyPath === "user") return undefined;
      return undefined;
    });
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(true);
    getItemSpy.mockRestore();
  });

  it("should not use legacy user when user object is null", async () => {
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return undefined;
      if (ns === "app" && keyPath === "user") return null;
      return undefined;
    });
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(true);
    getItemSpy.mockRestore();
  });

  it("should not use legacy user when user object has no id", async () => {
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return undefined;
      if (ns === "app" && keyPath === "user") return { id: "" };
      return undefined;
    });
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(true);
    getItemSpy.mockRestore();
  });

  it("when persisted has userId but no datadogId (partial-persisted), should preserve userId and generate only datadogId", async () => {
    const partialPersisted = {
      userId: "persisted-user-id-only",
      deviceIds: ["device-1"],
      pushDevicesSyncState: "synced" as const,
      pushDevicesServiceUrl: null,
    };
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return partialPersisted;
      if (ns === "app" && keyPath === "user") return undefined;
      return undefined;
    });
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    const state = store.getState().identities;
    expect(state.userId.exportUserIdForPersistence()).toBe("persisted-user-id-only");
    expect(state.datadogId?.exportDatadogIdForPersistence()).toBeDefined();
    expect(state.datadogId?.exportDatadogIdForPersistence()).not.toBe("persisted-user-id-only");
    expect(state.deviceIds).toHaveLength(1);
    expect(state.deviceIds[0].exportDeviceIdForPersistence()).toBe("device-1");
    getItemSpy.mockRestore();
  });

  it("when persisted has old shape (no userId/datadogId) and legacy user, should restore deviceIds and generate new ids (persisted takes precedence)", async () => {
    const oldShapePersisted = {
      deviceIds: ["device-old-1"],
      pushDevicesSyncState: "unsynced" as const,
      pushDevicesServiceUrl: "https://push.example.com",
    };
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return oldShapePersisted;
      if (ns === "app" && keyPath === "user") return { id: "legacy-user-from-app-user" };
      return undefined;
    });

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    const state = store.getState().identities;
    expect(state.userId.exportUserIdForPersistence()).not.toBe("legacy-user-from-app-user");
    expect(state.userId.exportUserIdForPersistence()).not.toBe("");
    expect(state.datadogId?.exportDatadogIdForPersistence()).toBeDefined();
    expect(state.deviceIds).toHaveLength(1);
    expect(state.deviceIds[0].exportDeviceIdForPersistence()).toBe("device-old-1");
    expect(state.pushDevicesSyncState).toBe("unsynced");
    expect(state.pushDevicesServiceUrl).toBe("https://push.example.com");
  });

  it("when persisted has old shape (no userId/datadogId) and no legacy user, should restore deviceIds and generate new ids", async () => {
    const oldShapePersisted = {
      deviceIds: ["device-old-2"],
      pushDevicesSyncState: "synced" as const,
      pushDevicesServiceUrl: null,
    };
    mockGetKey.mockImplementation(async (ns, keyPath) => {
      if (ns === "app" && keyPath === "identities") return oldShapePersisted;
      if (ns === "app" && keyPath === "user") return undefined;
      return undefined;
    });
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const store = createMockStore();
    const result = await initIdentities(store);

    expect(result).toBe(false);
    const state = store.getState().identities;
    expect(state.userId.exportUserIdForPersistence()).not.toBe("");
    expect(state.datadogId?.exportDatadogIdForPersistence()).not.toBe("");
    expect(state.deviceIds).toHaveLength(1);
    expect(state.deviceIds[0].exportDeviceIdForPersistence()).toBe("device-old-2");
    expect(state.pushDevicesSyncState).toBe("unsynced"); // slice forces unsynced when generating new userId so backend is updated
    getItemSpy.mockRestore();
  });
});
