import { CURRENT_PRIVACY_POLICY_VERSION } from "~/analytics/privacyConsent";
import { needsConsentRenewal, needsPrivacyPolicyAck } from "../utils/analyticsConsentDrawerLogic";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

describe("analyticsConsentDrawerLogic", () => {
  describe("needsPrivacyPolicyAck", () => {
    it("should return true when stored version is null", () => {
      expect(needsPrivacyPolicyAck(null, 1)).toBe(true);
    });

    it("should return true when stored version is below current", () => {
      expect(needsPrivacyPolicyAck(0, 1)).toBe(true);
      expect(needsPrivacyPolicyAck(1, 2)).toBe(true);
    });

    it("should return false when stored matches current", () => {
      expect(needsPrivacyPolicyAck(1, 1)).toBe(false);
      expect(
        needsPrivacyPolicyAck(CURRENT_PRIVACY_POLICY_VERSION, CURRENT_PRIVACY_POLICY_VERSION),
      ).toBe(false);
    });
  });

  describe("needsConsentRenewal", () => {
    it("should return true when consent date is null", () => {
      expect(needsConsentRenewal(null, 1_000_000_000_000)).toBe(true);
    });

    it("should return false for any past consent date when renewal interval is disabled (default)", () => {
      const now = 2_000_000_000_000;
      const iso = new Date(now - YEAR_MS * 10).toISOString();
      expect(needsConsentRenewal(iso, now)).toBe(false);
    });

    it("should return false within one year when interval is one year in ms", () => {
      const now = 2_000_000_000_000;
      const iso = new Date(now - YEAR_MS + 1000).toISOString();
      expect(needsConsentRenewal(iso, now, YEAR_MS)).toBe(false);
    });

    it("should return true after one year when interval is one year in ms", () => {
      const now = 2_000_000_000_000;
      const iso = new Date(now - YEAR_MS - 1000).toISOString();
      expect(needsConsentRenewal(iso, now, YEAR_MS)).toBe(true);
    });

    it("should return false for old consent when interval is null", () => {
      const now = 2_000_000_000_000;
      const iso = new Date(now - YEAR_MS - 1000).toISOString();
      expect(needsConsentRenewal(iso, now, null)).toBe(false);
    });

    it("should return true when consent date is empty string", () => {
      expect(needsConsentRenewal("", 2_000_000_000_000)).toBe(true);
    });

    it("should return true when consent date is invalid ISO", () => {
      expect(needsConsentRenewal("not-a-date", 2_000_000_000_000)).toBe(true);
    });
  });
});
