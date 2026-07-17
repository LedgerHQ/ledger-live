import { exportIdentitiesForPersistence } from "./persistence";
import { initialIdentitiesState } from "./types";
import { identitiesSlice } from "./slice";
import { DeviceId } from "./ids/DeviceId";
import { UserId } from "./ids/UserId";
import { DatadogId } from "./ids/DatadogId";

describe("exportIdentitiesForPersistence", () => {
  it("omits userId and datadogId when they are dummy", () => {
    const result = exportIdentitiesForPersistence(initialIdentitiesState);
    expect(result.userId).toBeUndefined();
    expect(result.datadogId).toBeUndefined();
  });

  it("includes real userId and datadogId when initialized", () => {
    const state = identitiesSlice.reducer(
      initialIdentitiesState,
      identitiesSlice.actions.initFromPersisted({
        userId: "user-real-123",
        datadogId: "dd-real-456",
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      }),
    );
    const result = exportIdentitiesForPersistence(state);
    expect(result.userId).toBe("user-real-123");
    expect(result.datadogId).toBe("dd-real-456");
  });

  it("serializes deviceIds as strings", () => {
    const d1 = new DeviceId("device-1");
    const d2 = new DeviceId("device-2");
    const state = {
      ...initialIdentitiesState,
      userId: UserId.fromString("u-1"),
      datadogId: DatadogId.fromString("dd-1"),
      deviceIds: [d1, d2],
    };
    const result = exportIdentitiesForPersistence(state);
    expect(result.deviceIds).toEqual(["device-1", "device-2"]);
  });

  it("preserves pushDevicesSyncState and pushDevicesServiceUrl", () => {
    const state = {
      ...initialIdentitiesState,
      pushDevicesSyncState: "unsynced" as const,
      pushDevicesServiceUrl: "https://push.example.com",
    };
    const result = exportIdentitiesForPersistence(state);
    expect(result.pushDevicesSyncState).toBe("unsynced");
    expect(result.pushDevicesServiceUrl).toBe("https://push.example.com");
  });
});
