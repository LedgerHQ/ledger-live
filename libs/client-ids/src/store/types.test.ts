import {
  DUMMY_USER_ID,
  DUMMY_DATADOG_ID,
  initialIdentitiesState,
  isDummyUserId,
  isDummyDatadogId,
} from "./types";
import { UserId } from "../ids/UserId";
import { DatadogId } from "../ids/DatadogId";

describe("types", () => {
  describe("dummy IDs", () => {
    it("DUMMY_USER_ID equals the zero uuid", () => {
      expect(DUMMY_USER_ID).toBeInstanceOf(UserId);
      expect(DUMMY_USER_ID.exportUserIdForPersistence()).toBe(
        "00000000-0000-0000-0000-000000000000",
      );
    });

    it("DUMMY_DATADOG_ID equals the zero uuid", () => {
      expect(DUMMY_DATADOG_ID).toBeInstanceOf(DatadogId);
      expect(DUMMY_DATADOG_ID.exportDatadogIdForPersistence()).toBe(
        "00000000-0000-0000-0000-000000000000",
      );
    });
  });

  describe("initialIdentitiesState", () => {
    it("has dummy userId and datadogId", () => {
      expect(initialIdentitiesState.userId).toBe(DUMMY_USER_ID);
      expect(initialIdentitiesState.datadogId).toBe(DUMMY_DATADOG_ID);
      expect(initialIdentitiesState.deviceIds).toEqual([]);
      expect(initialIdentitiesState.pushDevicesSyncState).toBe("synced");
      expect(initialIdentitiesState.pushDevicesServiceUrl).toBeNull();
    });
  });

  describe("isDummyUserId", () => {
    it("returns true for DUMMY_USER_ID", () => {
      expect(isDummyUserId(DUMMY_USER_ID)).toBe(true);
    });

    it("returns false for a real userId", () => {
      expect(isDummyUserId(UserId.fromString("real-user-123"))).toBe(false);
    });
  });

  describe("isDummyDatadogId", () => {
    it("returns true for DUMMY_DATADOG_ID", () => {
      expect(isDummyDatadogId(DUMMY_DATADOG_ID)).toBe(true);
    });

    it("returns false for a real datadogId", () => {
      expect(isDummyDatadogId(DatadogId.fromString("real-dd-456"))).toBe(false);
    });
  });
});
