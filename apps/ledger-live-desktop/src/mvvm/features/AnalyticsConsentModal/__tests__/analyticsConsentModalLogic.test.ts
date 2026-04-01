import { CURRENT_PRIVACY_POLICY_VERSION } from "~/renderer/analytics/privacyConsent";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  ONE_YEAR_MS,
} from "../analyticsConsentModalLogic";

describe("analyticsConsentModalLogic", () => {
  describe("needsPrivacyPolicyAck", () => {
    it("returns true when stored version is null", () => {
      expect(needsPrivacyPolicyAck(null)).toBe(true);
    });

    it("returns false when stored matches current", () => {
      expect(needsPrivacyPolicyAck(CURRENT_PRIVACY_POLICY_VERSION)).toBe(false);
    });
  });

  describe("needsConsentRenewal", () => {
    it("returns true when consent date is null", () => {
      expect(needsConsentRenewal(null)).toBe(true);
    });

    it("returns false within one year", () => {
      const recent = new Date(Date.now() - ONE_YEAR_MS / 2).toISOString();
      expect(needsConsentRenewal(recent)).toBe(false);
    });

    it("returns true after one year", () => {
      const old = new Date(Date.now() - ONE_YEAR_MS - 86_400_000).toISOString();
      expect(needsConsentRenewal(old)).toBe(true);
    });
  });
});
