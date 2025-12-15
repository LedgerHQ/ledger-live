import { userIdSelector, datadogIdSelector } from "./selectors";
import { IdentitiesState, DUMMY_USER_ID, DUMMY_DATADOG_ID } from "./types";
import { UserId, DatadogId } from "../ids";

describe("selectors", () => {
  describe("userIdSelector", () => {
    it("should return userId from state", () => {
      const realUserId = UserId.fromString("user-123");
      const state = {
        identities: {
          userId: realUserId,
          datadogId: DUMMY_DATADOG_ID,
          deviceIds: [],
          pushDevicesSyncState: "synced" as const,
          pushDevicesServiceUrl: null,
        } as IdentitiesState,
      };

      const userId = userIdSelector(state);

      expect(userId).toBe(realUserId);
      expect(userId.exportUserIdForPersistence()).toBe("user-123");
    });

    it("should return dummy userId when not initialized", () => {
      const state = {
        identities: {
          userId: DUMMY_USER_ID,
          datadogId: DUMMY_DATADOG_ID,
          deviceIds: [],
          pushDevicesSyncState: "synced" as const,
          pushDevicesServiceUrl: null,
        } as IdentitiesState,
      };

      const userId = userIdSelector(state);

      expect(userId).toBe(DUMMY_USER_ID);
    });
  });

  describe("datadogIdSelector", () => {
    it("should return datadogId from state", () => {
      const realDatadogId = DatadogId.fromString("datadog-456");
      const state = {
        identities: {
          userId: DUMMY_USER_ID,
          datadogId: realDatadogId,
          deviceIds: [],
          pushDevicesSyncState: "synced" as const,
          pushDevicesServiceUrl: null,
        } as IdentitiesState,
      };

      const datadogId = datadogIdSelector(state);

      expect(datadogId).toBe(realDatadogId);
      expect(datadogId.exportDatadogIdForPersistence()).toBe("datadog-456");
    });

    it("should return dummy datadogId when not initialized", () => {
      const state = {
        identities: {
          userId: DUMMY_USER_ID,
          datadogId: DUMMY_DATADOG_ID,
          deviceIds: [],
          pushDevicesSyncState: "synced" as const,
          pushDevicesServiceUrl: null,
        } as IdentitiesState,
      };

      const datadogId = datadogIdSelector(state);

      expect(datadogId).toBe(DUMMY_DATADOG_ID);
    });
  });
});
