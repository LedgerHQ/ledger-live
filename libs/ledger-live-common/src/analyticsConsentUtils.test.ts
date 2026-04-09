import { CURRENT_PRIVACY_POLICY_VERSION } from "./privacyConsent";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
} from "./analyticsConsentUtils";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

describe("analyticsConsentUtils", () => {
  describe("needsPrivacyPolicyAck", () => {
    it("returns true when stored version is null", () => {
      expect(needsPrivacyPolicyAck(null, 1)).toBe(true);
    });

    it("returns true when stored version is below current", () => {
      expect(needsPrivacyPolicyAck(0, 1)).toBe(true);
      expect(needsPrivacyPolicyAck(1, 2)).toBe(true);
    });

    it("returns false when stored matches current", () => {
      expect(needsPrivacyPolicyAck(1, 1)).toBe(false);
      expect(
        needsPrivacyPolicyAck(CURRENT_PRIVACY_POLICY_VERSION, CURRENT_PRIVACY_POLICY_VERSION),
      ).toBe(false);
    });
  });

  describe("needsConsentRenewal", () => {
    const NOW_MS = 2_000_000_000_000;

    it("returns true when consent date is null", () => {
      expect(needsConsentRenewal(null, 1_000_000_000_000)).toBe(true);
    });

    it("uses one-year default interval when third arg omitted", () => {
      expect(needsConsentRenewal(new Date(NOW_MS - YEAR_MS - 1000).toISOString(), NOW_MS)).toBe(
        true,
      );
      expect(needsConsentRenewal(new Date(NOW_MS - YEAR_MS + 1000).toISOString(), NOW_MS)).toBe(
        false,
      );
    });

    it("returns false within one year when interval is one year in ms", () => {
      const iso = new Date(NOW_MS - YEAR_MS + 1000).toISOString();
      expect(needsConsentRenewal(iso, NOW_MS, YEAR_MS)).toBe(false);
    });

    it("returns true after one year when interval is one year in ms", () => {
      const iso = new Date(NOW_MS - YEAR_MS - 1000).toISOString();
      expect(needsConsentRenewal(iso, NOW_MS, YEAR_MS)).toBe(true);
    });

    it("returns false for old consent when interval is null", () => {
      const iso = new Date(NOW_MS - YEAR_MS - 1000).toISOString();
      expect(needsConsentRenewal(iso, NOW_MS, null)).toBe(false);
    });

    it("returns true when consent date is empty string", () => {
      expect(needsConsentRenewal("", NOW_MS)).toBe(true);
    });

    it("returns true when consent date is invalid ISO", () => {
      expect(needsConsentRenewal("not-a-date", NOW_MS)).toBe(true);
    });
  });

  describe("resolveAnalyticsConsentPhase", () => {
    it("leaves non-closed phase unchanged", () => {
      expect(resolveAnalyticsConsentPhase("consentFresh", true, true, true)).toBe("consentFresh");
      expect(resolveAnalyticsConsentPhase("privacy", false, true, false)).toBe("privacy");
    });

    it("when closed and renewal: reconfirm if sharing on, else fresh", () => {
      expect(resolveAnalyticsConsentPhase("closed", true, false, true)).toBe("consentReconfirm");
      expect(resolveAnalyticsConsentPhase("closed", true, false, false)).toBe("consentFresh");
    });

    it("when closed, no renewal, privacy stale: privacy", () => {
      expect(resolveAnalyticsConsentPhase("closed", false, true, true)).toBe("privacy");
    });

    it("when closed, no renewal, no privacy update: fresh", () => {
      expect(resolveAnalyticsConsentPhase("closed", false, false, false)).toBe("consentFresh");
    });

    it("renewal takes precedence over privacy update", () => {
      expect(resolveAnalyticsConsentPhase("closed", true, true, true)).toBe("consentReconfirm");
      expect(resolveAnalyticsConsentPhase("closed", true, true, false)).toBe("consentFresh");
    });
  });
});
