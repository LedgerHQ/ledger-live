import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import Box from "~/renderer/components/Box";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  shareAnalyticsSelector,
} from "~/renderer/reducers/settings";
import {
  DANGEROUSLY_resetAnalyticsOptInStateForQa,
  DANGEROUSLY_setAnalyticsConsentInfoForQa,
} from "~/renderer/actions/settings";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import {
  CONSENT_RENEWAL_INTERVAL_MS,
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
} from "@ledgerhq/live-common/analyticsConsentUtils";

const formatConsentDate = (value: string | null) => {
  if (value === null) return "null";
  if (value === "") return '""';
  return value;
};

export function AnalyticsConsentOptInDevScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const analyticsOptInFeature = useFeature("analyticsOptIn");

  const needsPrivacy = needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion);
  const needsRenewal = needsConsentRenewal(consentInfo.consentDate);

  const shouldOfferModal = Boolean(
    analyticsOptInFeature?.enabled && hasCompletedOnboarding && (needsPrivacy || needsRenewal),
  );

  const modalPhaseIfOffered = resolveAnalyticsConsentPhase(
    "closed",
    needsRenewal,
    needsPrivacy,
    shareAnalytics,
  );

  const onBack = () => {
    navigate("/settings/developer");
  };

  const onPrivacyOutdated = () => {
    dispatch(
      DANGEROUSLY_setAnalyticsConsentInfoForQa({
        privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
      }),
    );
  };

  const onRemoveConsentDate = () => {
    dispatch(DANGEROUSLY_setAnalyticsConsentInfoForQa({ consentDate: null }));
  };

  /** One year (rolling) before now, plus one day — stale vs `CONSENT_RENEWAL_INTERVAL_MS` / `needsConsentRenewal`. */
  const onSetConsentDateOneYearAgo = () => {
    const staleIso = new Date(
      Date.now() - CONSENT_RENEWAL_INTERVAL_MS - 24 * 60 * 60 * 1000,
    ).toISOString();
    dispatch(DANGEROUSLY_setAnalyticsConsentInfoForQa({ consentDate: staleIso }));
  };

  const onResetForConsentFresh = () => {
    dispatch(DANGEROUSLY_resetAnalyticsOptInStateForQa());
  };

  return (
    <Box grow shrink className="p-8 pb-16">
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button size="sm" appearance="no-background" onClick={onBack} icon={ArrowLeft}>
            Back
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,28rem)] text-center text-base">
          Analytics opt-in consent — QA
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <Box className="mx-auto flex max-w-2xl flex-col gap-16 px-4">
        <section className="flex flex-col gap-8">
          <h2 className="body-2-semi-bold text-muted">Current settings (read-only)</h2>
          <div className="flex flex-col gap-8">
            <p className="body-2 leading-relaxed text-muted">
              App current privacy policy version: {String(CURRENT_PRIVACY_POLICY_VERSION)}
            </p>
            <div className="flex flex-row flex-wrap items-center justify-between gap-10">
              <span
                className={`min-w-0 flex-1 body-2 font-medium leading-relaxed ${
                  needsPrivacy ? "text-error" : "text-success"
                }`}
              >
                Stored privacy policy version:{" "}
                {consentInfo.privacyPolicyVersion === null
                  ? "null"
                  : String(consentInfo.privacyPolicyVersion)}
              </span>
              <Button
                className="shrink-0 self-center"
                size="sm"
                appearance="accent"
                onClick={onPrivacyOutdated}
              >
                Outdate version
              </Button>
            </div>
            <div className="flex flex-row flex-wrap items-center justify-between gap-10">
              <span
                className={`min-w-0 flex-1 body-2 font-medium leading-relaxed ${
                  needsRenewal ? "text-error" : "text-success"
                }`}
              >
                Consent date (raw): {formatConsentDate(consentInfo.consentDate)}
              </span>
              <div className="flex shrink-0 flex-col gap-2 self-center sm:flex-row sm:items-center">
                <Button size="sm" appearance="accent" onClick={onSetConsentDateOneYearAgo}>
                  Set date ~1 year ago (stale)
                </Button>
                <Button size="sm" appearance="accent" onClick={onRemoveConsentDate}>
                  Remove date
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-32 flex flex-col gap-6 border-t border-muted-subtle pt-14">
          <h2 className="body-2-semi-bold text-muted">Expected modal on portfolio (home)</h2>
          {!hasCompletedOnboarding ? (
            <p className="body-2 font-medium leading-relaxed text-muted">
              No modal. Onboarding is not complete yet.
            </p>
          ) : !analyticsOptInFeature?.enabled ? (
            <p className="body-2 font-medium leading-relaxed text-muted">
              No modal. The analytics opt-in feature flag is off.
            </p>
          ) : !shouldOfferModal ? (
            <p className="body-2 font-medium leading-relaxed text-success">
              No modal. Privacy policy version and consent date are fine: nothing to renew or
              re-acknowledge.
            </p>
          ) : modalPhaseIfOffered === "consentReconfirm" ? (
            <p className="body-2 font-medium leading-relaxed text-interactive">
              Reconfirm consent modal. Consent renewal is required and Share analytics is on — user
              gets the reconfirm / continue-or-stop flow instead of first-time copy.
            </p>
          ) : modalPhaseIfOffered === "consentFresh" ? (
            <p className="body-2 font-medium leading-relaxed text-interactive">
              First-time consent modal (consent fresh). Consent renewal is required (missing or
              invalid consent date) and Share analytics is off — e.g. no stored privacy ack / no
              consent date with analytics disabled.
            </p>
          ) : modalPhaseIfOffered === "privacy" ? (
            <p className="body-2 font-medium leading-relaxed text-interactive">
              Privacy update modal. Stored privacy policy version is outdated (lower than the app),
              and consent renewal is not blocking — user sees the privacy-policy update step first.
            </p>
          ) : (
            <p className="body-2 font-medium leading-relaxed text-success">
              No modal. Privacy policy version and consent date are fine: nothing to renew or
              re-acknowledge.
            </p>
          )}
          <p className="body-3 leading-relaxed text-muted">
            Open the portfolio home page to see the modal when it should appear.
          </p>
        </section>

        <section className="mt-32 flex flex-col gap-8">
          <Button size="sm" appearance="red" onClick={onResetForConsentFresh}>
            Reset for consent fresh (clear consent data, turn off analytics & personalization)
          </Button>
          <p className="max-w-xl leading-relaxed body-3 text-muted">
            Remove date sets consent to null. &quot;~1 year ago&quot; sets consent to just beyond
            the rolling renewal window (CONSENT_RENEWAL_INTERVAL_MS in live-common) so consent is
            stale for tracking and modal logic. Outdate version lowers the stored privacy policy
            version below the app&apos;s current version. Reset clears consent metadata and turns
            off analytics and personalization to reproduce the consent fresh modal.
          </p>
        </section>
      </Box>
    </Box>
  );
}
