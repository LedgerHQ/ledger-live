import { isCALIntegrationEnabled, getCALStore } from "./cal-integration";
import { CALStore } from "./cal-store";
import { isFeature } from "../../featureFlags/firebaseFeatureFlags";

jest.mock("../../featureFlags/firebaseFeatureFlags", () => ({
  isFeature: jest.fn(),
}));

const mockIsFeature = jest.mocked(isFeature);

describe("CAL Integration", () => {
  beforeEach(() => {
    mockIsFeature.mockClear();
  });

  describe("isCALIntegrationEnabled", () => {
    it("should return false when feature flag is disabled", () => {
      mockIsFeature.mockReturnValue(false);

      expect(isCALIntegrationEnabled()).toBe(false);
      expect(mockIsFeature).toHaveBeenCalledWith("calLedgerService");
    });

    it("should return true when feature flag is enabled (assuming MOCK is false)", () => {
      mockIsFeature.mockReturnValue(true);

      const result = isCALIntegrationEnabled();
      expect(mockIsFeature).toHaveBeenCalledWith("calLedgerService");
      expect(result).toEqual(true);
    });

    it("should return false when feature check throws", () => {
      mockIsFeature.mockImplementation(() => {
        throw new Error("Feature check error");
      });

      expect(isCALIntegrationEnabled()).toBe(false);
    });
  });

  describe("getCALStore", () => {
    it("should return a CALStore instance", () => {
      const store = getCALStore();
      expect(store).toBeInstanceOf(CALStore);
    });

    it("should return the same instance on multiple calls", () => {
      const store1 = getCALStore();
      const store2 = getCALStore();
      expect(store1).toBe(store2);
    });
  });
});
