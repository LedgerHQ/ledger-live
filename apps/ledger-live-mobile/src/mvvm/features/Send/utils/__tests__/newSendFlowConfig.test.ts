import {
  getNewSendFlowAllowedFamilies,
  isFamilyAllowedForNewSendFlow,
  isValidNewSendFlowConfig,
} from "../newSendFlowConfig";

describe("newSendFlowConfig", () => {
  describe("isValidNewSendFlowConfig", () => {
    it("should return false when feature is null or undefined", () => {
      expect(isValidNewSendFlowConfig(null)).toBe(false);
      expect(isValidNewSendFlowConfig(undefined)).toBe(false);
    });

    it("should return false when feature is not enabled", () => {
      expect(isValidNewSendFlowConfig({ enabled: false, params: { families: ["ethereum"] } })).toBe(
        false,
      );
    });

    it("should return false when families is not an array", () => {
      expect(isValidNewSendFlowConfig({ enabled: true, params: { families: "ethereum" } })).toBe(
        false,
      );
      expect(isValidNewSendFlowConfig({ enabled: true, params: {} })).toBe(false);
      expect(isValidNewSendFlowConfig({ enabled: true })).toBe(false);
    });

    it("should return false when families array is empty", () => {
      expect(isValidNewSendFlowConfig({ enabled: true, params: { families: [] } })).toBe(false);
    });

    it("should return true when enabled and families is a non-empty array", () => {
      expect(isValidNewSendFlowConfig({ enabled: true, params: { families: ["ethereum"] } })).toBe(
        true,
      );
      expect(
        isValidNewSendFlowConfig({ enabled: true, params: { families: ["bitcoin", "ethereum"] } }),
      ).toBe(true);
    });
  });

  describe("getNewSendFlowAllowedFamilies", () => {
    it("should return empty array when feature is null or undefined", () => {
      expect(getNewSendFlowAllowedFamilies(null)).toEqual([]);
      expect(getNewSendFlowAllowedFamilies(undefined)).toEqual([]);
    });

    it("should return empty array when families is not an array", () => {
      expect(getNewSendFlowAllowedFamilies({ params: { families: "ethereum" } })).toEqual([]);
      expect(getNewSendFlowAllowedFamilies({ params: {} })).toEqual([]);
    });

    it("should return families array when valid", () => {
      expect(getNewSendFlowAllowedFamilies({ params: { families: ["ethereum"] } })).toEqual([
        "ethereum",
      ]);
      expect(
        getNewSendFlowAllowedFamilies({ params: { families: ["bitcoin", "ethereum"] } }),
      ).toEqual(["bitcoin", "ethereum"]);
    });
  });

  describe("isFamilyAllowedForNewSendFlow", () => {
    const allowedFamilies = ["ethereum", "bitcoin"];

    it("should return false when config is invalid", () => {
      expect(isFamilyAllowedForNewSendFlow("ethereum", allowedFamilies, false)).toBe(false);
      expect(isFamilyAllowedForNewSendFlow(undefined, allowedFamilies, false)).toBe(false);
    });

    it("should return true when family is undefined or empty (no filter)", () => {
      expect(isFamilyAllowedForNewSendFlow(undefined, allowedFamilies, true)).toBe(true);
      expect(isFamilyAllowedForNewSendFlow("", allowedFamilies, true)).toBe(true);
    });

    it("should return true when family is in allowedFamilies", () => {
      expect(isFamilyAllowedForNewSendFlow("ethereum", allowedFamilies, true)).toBe(true);
      expect(isFamilyAllowedForNewSendFlow("bitcoin", allowedFamilies, true)).toBe(true);
    });

    it("should return false when family is not in allowedFamilies", () => {
      expect(isFamilyAllowedForNewSendFlow("solana", allowedFamilies, true)).toBe(false);
      expect(isFamilyAllowedForNewSendFlow("cosmos", allowedFamilies, true)).toBe(false);
    });
  });
});
