import { asBatteryPercentage } from "./asBatteryPercentage";

describe("asBatteryPercentage", () => {
  describe("success", () => {
    it("should return the number when the response is a percentage", () => {
      expect(asBatteryPercentage(80)).toBe(80);
    });
  });

  describe("error", () => {
    it("should throw when the response is battery flags", () => {
      expect(() =>
        asBatteryPercentage({
          charging: 0,
          issueCharging: false,
          issueTemperature: false,
          issueBattery: false,
        }),
      ).toThrow("Expected a battery percentage, got battery flags");
    });
  });
});
