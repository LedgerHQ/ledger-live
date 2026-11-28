import { asBatteryFlags } from "./asBatteryFlags";

const BATTERY_FLAGS = {
  charging: 1,
  issueCharging: false,
  issueTemperature: false,
  issueBattery: false,
};

describe("asBatteryFlags", () => {
  describe("success", () => {
    it("should return the flags when the response is not a percentage", () => {
      expect(asBatteryFlags(BATTERY_FLAGS)).toBe(BATTERY_FLAGS);
    });
  });

  describe("error", () => {
    it("should throw when the response is a battery percentage", () => {
      expect(() => asBatteryFlags(42)).toThrow("Expected battery flags, got a battery percentage");
    });
  });
});
