import { configureStore } from "@reduxjs/toolkit";
import type { Store } from "redux";
import { identitiesSlice } from "@ledgerhq/client-ids/store";
import { initIdentities } from "./identities";
import { saveIdentities, deleteUser } from "../db";
import type { State } from "../reducers/types";

jest.mock("../db", () => ({
  saveIdentities: jest.fn(),
  deleteUser: jest.fn(),
}));

const mockSaveIdentities = jest.mocked(saveIdentities);
const mockDeleteUser = jest.mocked(deleteUser);

function createTestStore(): Store<State> {
  // Minimal store for tests; cast needed because we only mount identities reducer
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return configureStore({
    reducer: { identities: identitiesSlice.reducer },
  }) as unknown as Store<State>;
}

describe("initIdentities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use legacy user when present and merge with persisted deviceIds", async () => {
    const testStore = createTestStore();
    const persisted = {
      deviceIds: ["device-1"],
      pushDevicesSyncState: "synced" as const,
      pushDevicesServiceUrl: null,
    };
    const legacyUser = { id: "legacy-user-id", datadogId: "legacy-dd-id" };

    await initIdentities(testStore, persisted, legacyUser);

    const state = testStore.getState() as State;
    expect(state.identities.userId.exportUserIdForPersistence()).toBe("legacy-user-id");
    expect(state.identities.datadogId.exportDatadogIdForPersistence()).toBe("legacy-dd-id");
    expect(state.identities.deviceIds).toHaveLength(1);
    expect(state.identities.deviceIds[0].exportDeviceIdForPersistence()).toBe("device-1");
    expect(mockSaveIdentities).toHaveBeenCalledTimes(1);
    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
  });

  it("should use legacy user when persisted has no userId (overwrite polluted persisted)", async () => {
    const testStore = createTestStore();
    const persisted = {
      userId: "polluted-user-id",
      datadogId: "polluted-dd-id",
      deviceIds: [],
      pushDevicesSyncState: "synced" as const,
      pushDevicesServiceUrl: null,
    };
    const legacyUser = { id: "trusted-legacy-id", datadogId: "trusted-dd-id" };

    await initIdentities(testStore, persisted, legacyUser);

    const state = testStore.getState() as State;
    expect(state.identities.userId.exportUserIdForPersistence()).toBe("trusted-legacy-id");
    expect(state.identities.datadogId.exportDatadogIdForPersistence()).toBe("trusted-dd-id");
    expect(mockSaveIdentities).toHaveBeenCalledTimes(1);
    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
  });

  it("should use persisted when it has valid userId and no legacy user", async () => {
    const testStore = createTestStore();
    const persisted = {
      userId: "persisted-user-123",
      datadogId: "persisted-dd-456",
      deviceIds: [],
      pushDevicesSyncState: "unsynced" as const,
      pushDevicesServiceUrl: null,
    };

    await initIdentities(testStore, persisted, null);

    const state = testStore.getState() as State;
    expect(state.identities.userId.exportUserIdForPersistence()).toBe("persisted-user-123");
    expect(state.identities.datadogId.exportDatadogIdForPersistence()).toBe("persisted-dd-456");
    expect(mockSaveIdentities).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("should dispatch initFromScratch when no persisted userId and no legacy user", async () => {
    const testStore = createTestStore();
    await initIdentities(testStore, null, null);

    const state = testStore.getState() as State;
    expect(state.identities.userId.exportUserIdForPersistence()).not.toBe("");
    expect(state.identities.datadogId.exportDatadogIdForPersistence()).not.toBe("");
    expect(mockSaveIdentities).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("when persisted has no userId, initFromPersisted runs and slice generates new ids", async () => {
    const testStore = createTestStore();
    const persisted = {
      deviceIds: [],
      pushDevicesSyncState: "synced" as const,
      pushDevicesServiceUrl: null,
    };

    await initIdentities(testStore, persisted, null);

    const state = testStore.getState() as State;
    expect(state.identities.userId.exportUserIdForPersistence()).not.toBe("");
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("should merge legacy user with empty persisted when persisted is null", async () => {
    const testStore = createTestStore();
    const legacyUser = { id: "legacy-only", datadogId: "dd-only" };

    await initIdentities(testStore, null, legacyUser);

    const state = testStore.getState() as State;
    expect(state.identities.userId.exportUserIdForPersistence()).toBe("legacy-only");
    expect(state.identities.deviceIds).toEqual([]);
    expect(mockSaveIdentities).toHaveBeenCalledTimes(1);
    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
  });

  it("should not use legacy when legacy user has no id", async () => {
    const testStore = createTestStore();
    const legacyUser = { id: "", datadogId: "dd" };

    await initIdentities(testStore, null, legacyUser);

    const state = testStore.getState() as State;
    expect(state.identities.userId.exportUserIdForPersistence()).not.toBe("");
    expect(mockSaveIdentities).not.toHaveBeenCalled();
  });
});
