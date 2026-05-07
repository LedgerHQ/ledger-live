import {
  getNewSendFlowAllowedFamilies,
  getNewSendFlowExcludedCurrencyIds,
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

  describe("getNewSendFlowExcludedCurrencyIds", () => {
    it("should return empty array when feature is null or undefined", () => {
      expect(getNewSendFlowExcludedCurrencyIds(null)).toEqual([]);
      expect(getNewSendFlowExcludedCurrencyIds(undefined)).toEqual([]);
    });

    it("should return empty array when excludedCurrencyIds is not an array", () => {
      expect(
        getNewSendFlowExcludedCurrencyIds({ params: { excludedCurrencyIds: "zcash" } }),
      ).toEqual([]);
      expect(getNewSendFlowExcludedCurrencyIds({ params: {} })).toEqual([]);
    });

    it("should return excluded currency ids array when valid", () => {
      expect(
        getNewSendFlowExcludedCurrencyIds({ params: { excludedCurrencyIds: ["zcash"] } }),
      ).toEqual(["zcash"]);
    });
  });

  describe("isFamilyAllowedForNewSendFlow", () => {
    const allowedFamilies = ["ethereum", "bitcoin"];

    it("should return true when family is undefined or empty (no filter)", () => {
      expect(isFamilyAllowedForNewSendFlow(undefined, allowedFamilies)).toBe(true);
      expect(isFamilyAllowedForNewSendFlow("", allowedFamilies)).toBe(true);
    });

    it("should return true when family is in allowedFamilies", () => {
      expect(isFamilyAllowedForNewSendFlow("ethereum", allowedFamilies)).toBe(true);
      expect(isFamilyAllowedForNewSendFlow("bitcoin", allowedFamilies)).toBe(true);
    });

    it("should return false when family is not in allowedFamilies", () => {
      expect(isFamilyAllowedForNewSendFlow("solana", allowedFamilies)).toBe(false);
      expect(isFamilyAllowedForNewSendFlow("cosmos", allowedFamilies)).toBe(false);
    });

    it("should return false when currency is excluded even if family is allowed", () => {
      expect(isFamilyAllowedForNewSendFlow("bitcoin", allowedFamilies, "zcash", ["zcash"])).toBe(
        false,
      );
    });

    it("should return true when family is allowed and currency is not excluded", () => {
      expect(isFamilyAllowedForNewSendFlow("bitcoin", allowedFamilies, "bitcoin", ["zcash"])).toBe(
        true,
      );
    });
  });
});
