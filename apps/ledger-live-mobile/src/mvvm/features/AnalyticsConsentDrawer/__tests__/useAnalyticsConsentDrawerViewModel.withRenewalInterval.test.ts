/**
 * Production uses CONSENT_RENEWAL_INTERVAL_MS = null, so time-based renewal is off.
 * This file mocks a finite interval to assert behavior when renewal-by-time is enabled
 * (e.g. if the constant is changed to a yearly value later).
 */
import { renderHook, waitFor } from "@tests/test-renderer";
import { CURRENT_PRIVACY_POLICY_VERSION } from "~/analytics/privacyConsent";
import { useAnalyticsConsentDrawerViewModel } from "../useAnalyticsConsentDrawerViewModel";
import { withConsentDrawerState } from "./helpers";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
  useIsFocused: () => true,
}));

jest.mock("../analyticsConsentDrawerLogic", () => {
  const renewalMs = 365 * 24 * 60 * 60 * 1000;
  const actual = jest.requireActual<typeof import("../analyticsConsentDrawerLogic")>(
    "../analyticsConsentDrawerLogic",
  );
  return {
    ...actual,
    CONSENT_RENEWAL_INTERVAL_MS: renewalMs,
    needsConsentRenewal: (
      consentDateIso: string | null,
      now?: number,
      renewalIntervalMs?: number | null,
    ) =>
      actual.needsConsentRenewal(
        consentDateIso,
        now,
        renewalIntervalMs === undefined ? renewalMs : renewalIntervalMs,
      ),
  };
});

describe("useAnalyticsConsentDrawerViewModel (renewal interval mocked)", () => {
  it("should open consentFresh when consent is stale by time and analytics is off", async () => {
    const oldIso = new Date(Date.now() - YEAR_MS - 86_400_000).toISOString();
    const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState({
        analyticsEnabled: false,
        personalizedRecommendationsEnabled: false,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        consentDate: oldIso,
      }),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentFresh");
    });
  });

  it("should open consentReconfirm when consent is stale by time even if both toggles are on (renewal first)", async () => {
    const oldIso = new Date(Date.now() - YEAR_MS - 86_400_000).toISOString();
    const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState({
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: true,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        consentDate: oldIso,
      }),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentReconfirm");
    });
  });
});
