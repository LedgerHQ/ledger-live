import { add } from "date-fns";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
} from "./analyticsConsentUtils";

describe("analyticsConsentUtils", () => {
  describe("needsPrivacyPolicyAck", () => {
    it("returns true when stored version is null", () => {
      expect(needsPrivacyPolicyAck(null, 1)).toBe(true);
    });

    it("returns true when stored version is below current", () => {
      expect(needsPrivacyPolicyAck(0, 1)).toBe(true);
      expect(needsPrivacyPolicyAck(1, 2)).toBe(true);
    });

    it("returns false when stored version matches current", () => {
      expect(needsPrivacyPolicyAck(1, 1)).toBe(false);
      expect(needsPrivacyPolicyAck(20260531, 20260531)).toBe(false);
    });

    it("supports date-style numeric policy versions", () => {
      expect(needsPrivacyPolicyAck(1, 20260531)).toBe(true);
      expect(needsPrivacyPolicyAck(20260531, 20261231)).toBe(true);
      expect(needsPrivacyPolicyAck(20261231, 20260531)).toBe(false);
    });
  });

  describe("needsConsentRenewal", () => {
    const NOW = new Date("2024-06-15T12:00:00.000Z");

    it("returns true when consent is null or empty", () => {
      expect(needsConsentRenewal(null, 365, NOW)).toBe(true);
      expect(needsConsentRenewal("", 365, NOW)).toBe(true);
    });

    it("returns false when consent is within the validity window", () => {
      const iso = add(NOW, { days: -300 }).toISOString();
      expect(needsConsentRenewal(iso, 365, NOW)).toBe(false);
    });

    it("returns true when consent is past the rolling window", () => {
      const iso = add(NOW, { days: -400 }).toISOString();
      expect(needsConsentRenewal(iso, 365, NOW)).toBe(true);
    });

    it("returns false on the deadline instant", () => {
      const consent = new Date("2023-06-01T12:00:00.000Z");
      const deadline = add(consent, { days: 365 });
      expect(needsConsentRenewal(consent.toISOString(), 365, deadline)).toBe(false);
    });

    it("returns true immediately after the deadline", () => {
      const consent = new Date("2023-06-01T12:00:00.000Z");
      const deadline = add(consent, { days: 365 });
      const justAfter = new Date(deadline.getTime() + 1);
      expect(needsConsentRenewal(consent.toISOString(), 365, justAfter)).toBe(true);
    });

    it("respects a shorter configured validity", () => {
      const consent = add(NOW, { days: -31 });
      expect(needsConsentRenewal(consent.toISOString(), 30, NOW)).toBe(true);
    });

    it("returns true for invalid ISO strings", () => {
      expect(needsConsentRenewal("not-a-date", 365, NOW)).toBe(true);
    });
  });

  describe("resolveAnalyticsConsentPhase", () => {
    it("returns current phase when not closed", () => {
      expect(resolveAnalyticsConsentPhase("privacy", true, true, false)).toBe("privacy");
    });

    it("returns consentReconfirm when renewal needed and sharing was on", () => {
      expect(resolveAnalyticsConsentPhase("closed", true, false, true)).toBe("consentReconfirm");
    });

    it("returns consentFresh when renewal needed and sharing was off", () => {
      expect(resolveAnalyticsConsentPhase("closed", true, false, false)).toBe("consentFresh");
    });

    it("returns privacy when only policy update needed", () => {
      expect(resolveAnalyticsConsentPhase("closed", false, true, true)).toBe("privacy");
    });

    it("returns consentFresh when nothing special is needed", () => {
      expect(resolveAnalyticsConsentPhase("closed", false, false, true)).toBe("consentFresh");
    });
  });
});
