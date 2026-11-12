import { matchDeviceByName } from "./matchDeviceByName";

describe("matchDeviceByName", () => {
  describe("success", () => {
    it("should match a default name that lost its prefix after the update", () => {
      expect(matchDeviceByName("Ledger Nano X 123A", "123A")).toBe(true);
    });

    it("should match a default name whatever the model in it", () => {
      expect(matchDeviceByName("Nano X 9fFe", "9fFe")).toBe(true);
    });

    it("should match a custom name, which the update leaves untouched", () => {
      expect(matchDeviceByName("Benjamin's device", "Benjamin's device")).toBe(true);
    });
  });

  describe("error", () => {
    it("should not match when either name is missing", () => {
      expect(matchDeviceByName(undefined, "123A")).toBe(false);
      expect(matchDeviceByName("Ledger Nano X 123A", null)).toBe(false);
      expect(matchDeviceByName("", "")).toBe(false);
    });

    it("should not match a default name against another device's suffix", () => {
      expect(matchDeviceByName("Ledger Nano X 123A", "456B")).toBe(false);
    });

    it("should not match when the candidate is not a bare hexadecimal suffix", () => {
      expect(matchDeviceByName("Ledger Nano X 123A", "Ledger Nano X 456B")).toBe(false);
      expect(matchDeviceByName("Ledger Nano X 123A", "123AB")).toBe(false);
    });

    it("should not match when the previous name is not a default one", () => {
      expect(matchDeviceByName("My 123A", "123A")).toBe(false);
    });
  });
});
