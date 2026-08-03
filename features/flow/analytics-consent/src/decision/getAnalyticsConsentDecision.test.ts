import { parsePolicyVersion, type AnalyticsConsentInfo } from "@domain/entity-analytics-consent";
import { mockAnalyticsConsentInfo } from "@domain/entity-analytics-consent/schema.mock";
import { getAnalyticsConsentDecision } from "./getAnalyticsConsentDecision";
import type { AnalyticsConsentDecision } from "../types";

const NOW = new Date("2026-07-29T10:00:00.000Z");
const MS_PER_DAY = 86_400_000;

const daysAgo = (days: number) => new Date(NOW.getTime() - days * MS_PER_DAY).toISOString();

const consent = (
  privacyPolicyVersion: number | string | null,
  consentDate: string | null = daysAgo(10),
) => mockAnalyticsConsentInfo({ consentDate, privacyPolicyVersion });

const decide = (
  stored: AnalyticsConsentInfo,
  currentPolicyVersion: number | string | null,
): AnalyticsConsentDecision =>
  getAnalyticsConsentDecision(stored, {
    currentPolicyVersion:
      currentPolicyVersion === null ? null : parsePolicyVersion(currentPolicyVersion),
  });

describe("getAnalyticsConsentDecision", () => {
  describe("full analytics renewal", () => {
    it("renews when no consent was ever given", () => {
      expect(decide(consent(null, null), "1.0")).toEqual({
        kind: "renewal",
        reason: "consent_date_missing",
      });
    });

    it("renews when the consent date is not a parseable date", () => {
      expect(decide(consent(1, "not-a-date"), "1.0")).toEqual({
        kind: "renewal",
        reason: "consent_date_invalid",
      });
    });

    it("renews when the major version is newer than the stored one", () => {
      expect(decide(consent("1.5"), "2.0")).toEqual({ kind: "renewal", reason: "major_bump" });
    });

    it("reads a stored legacy number as a major version", () => {
      expect(decide(consent(1), "2")).toEqual({ kind: "renewal", reason: "major_bump" });
    });

    it("renews when the stored version is missing but the consent date is valid", () => {
      expect(decide(consent(null), "1.0")).toEqual({
        kind: "renewal",
        reason: "stored_version_missing",
      });
    });

    it("renews when the stored version cannot be parsed", () => {
      expect(decide(consent("v1.2"), "1.0")).toEqual({
        kind: "renewal",
        reason: "stored_version_invalid",
      });
    });

    it("prefers renewal over privacy acknowledgement when the stored date is corrupted", () => {
      expect(decide(consent("2.0", "not-a-date"), "2.1")).toEqual({
        kind: "renewal",
        reason: "consent_date_invalid",
      });
    });
  });

  describe("privacy acknowledgement only", () => {
    it("asks for acknowledgement on a minor bump", () => {
      expect(decide(consent("2.0"), "2.1")).toEqual({ kind: "privacy", reason: "minor_bump" });
    });

    it("compares minor versions numerically", () => {
      expect(decide(consent("2.9"), "2.10")).toEqual({ kind: "privacy", reason: "minor_bump" });
    });

    it("asks for acknowledgement when a legacy stored number gains a minor version", () => {
      expect(decide(consent(1), "1.1")).toEqual({ kind: "privacy", reason: "minor_bump" });
    });

    it("asks for acknowledgement rather than renewal when a coerced float lags behind", () => {
      expect(decide(consent(1.4), "1.5")).toEqual({ kind: "privacy", reason: "minor_bump" });
    });
  });

  describe("no prompt", () => {
    it("stays silent when the stored version matches the current one", () => {
      expect(decide(consent("2.1"), "2.1")).toEqual({ kind: "none", reason: "up_to_date" });
    });

    it("treats a stored legacy number as the implicit minor zero", () => {
      expect(decide(consent(1), "1.0")).toEqual({ kind: "none", reason: "up_to_date" });
    });

    it("stays silent for a user who acknowledged 1.4 on a client that coerced it to a float", () => {
      expect(decide(consent(1.4), "1.4")).toEqual({ kind: "none", reason: "up_to_date" });
    });

    it("stays silent however old the consent date is, since renewal is version-driven", () => {
      expect(decide(consent(1, daysAgo(3650)), "1.0")).toEqual({
        kind: "none",
        reason: "up_to_date",
      });
    });

    it.each([{ current: 1.2 }, { current: "1.02" }, { current: "v2" }, { current: null }])(
      "disables version checks when the current version $current is invalid",
      ({ current }) => {
        expect(decide(consent(1), current as number | string | null)).toEqual({
          kind: "none",
          reason: "current_version_invalid",
        });
      },
    );

    it("still renews on a missing consent date when the current version is invalid", () => {
      expect(decide(consent(1, null), null)).toEqual({
        kind: "renewal",
        reason: "consent_date_missing",
      });
    });

    it.each([{ stored: "3.0" }, { stored: "2.2" }])(
      "allows a remote-config rollback with stored version $stored newer than current 2.1",
      ({ stored }) => {
        expect(decide(consent(stored), "2.1")).toEqual({
          kind: "none",
          reason: "stored_version_newer",
        });
      },
    );
  });
});
