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
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
  resolveAnalyticsOptInParams,
} from "@ledgerhq/live-common/analyticsConsent/index";

const COPY = {
  back: "Back",
  title: "Analytics opt-in consent — QA",
  readSection: "Current settings (read-only)",
  currentPrivacyVersion: (version: string) => `App current privacy policy version: ${version}`,
  currentConsentValidityDays: (days: number) => `App current consent validity (days): ${days}`,
  storedPrivacyVersion: (version: string) => `Stored privacy policy version: ${version}`,
  consentDate: (value: string) => `Consent date (raw): ${value}`,
  outdatePrivacyVersion: "Outdate version",
  consentOneYearAgo: "Set to one year ago",
  resetForConsentFresh:
    "Reset for consent fresh (clear consent data, turn off analytics & personalization)",
  modalSection: "Expected modal on portfolio (home)",
  modalGoToHome: "Open the portfolio home page to see the modal when it should appear.",
  modal: {
    noModalUserOk:
      "No modal. Privacy policy version and consent date are fine: nothing to renew or re-acknowledge.",
    noModalFeatureOff: "No modal. The analytics opt-in feature flag is off.",
    noModalOnboarding: "No modal. Onboarding is not complete yet.",
    fresh:
      "First-time consent modal (consent fresh). Consent renewal is required (missing or invalid consent date) and Share analytics is off — e.g. no stored privacy ack / no consent date with analytics disabled.",
    reconfirm:
      "Reconfirm consent modal. Consent renewal is required and Share analytics is on — user gets the reconfirm / continue-or-stop flow instead of first-time copy.",
    privacy:
      "Privacy update modal. Stored privacy policy version is outdated (lower than the app), and consent renewal is not blocking — user sees the privacy-policy update step first.",
  },
} as const;

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
  const { policyVersion, consentValidityDays } = resolveAnalyticsOptInParams(analyticsOptInFeature);

  const needsPrivacy = needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion, policyVersion);
  const needsRenewal = needsConsentRenewal(consentInfo.consentDate, consentValidityDays);

  const shouldOfferModal = Boolean(
    analyticsOptInFeature?.enabled && hasCompletedOnboarding && (needsPrivacy || needsRenewal),
  );

  const modalPhaseIfOffered = resolveAnalyticsConsentPhase(
    "closed",
    needsRenewal,
    needsPrivacy,
    shareAnalytics,
  );

  const modalPreview = (() => {
    if (!hasCompletedOnboarding) {
      return { body: COPY.modal.noModalOnboarding, textClass: "text-muted" as const };
    }
    if (!analyticsOptInFeature?.enabled) {
      return { body: COPY.modal.noModalFeatureOff, textClass: "text-muted" as const };
    }
    if (!shouldOfferModal) {
      return { body: COPY.modal.noModalUserOk, textClass: "text-success" as const };
    }
    if (modalPhaseIfOffered === "consentReconfirm") {
      return { body: COPY.modal.reconfirm, textClass: "text-interactive" as const };
    }
    if (modalPhaseIfOffered === "consentFresh") {
      return { body: COPY.modal.fresh, textClass: "text-interactive" as const };
    }
    if (modalPhaseIfOffered === "privacy") {
      return { body: COPY.modal.privacy, textClass: "text-interactive" as const };
    }
    return { body: COPY.modal.noModalUserOk, textClass: "text-success" as const };
  })();

  const onBack = () => {
    navigate("/settings/developer");
  };

  const onPrivacyOutdated = () => {
    dispatch(
      DANGEROUSLY_setAnalyticsConsentInfoForQa({
        privacyPolicyVersion: Math.max(0, policyVersion - 1),
      }),
    );
  };

  const onSetConsentOneYearAgo = () => {
    const raw = consentInfo.consentDate;
    const base = raw ? new Date(raw) : new Date();
    const d = Number.isNaN(base.getTime()) ? new Date() : base;
    d.setUTCFullYear(d.getUTCFullYear() - 1);
    dispatch(
      DANGEROUSLY_setAnalyticsConsentInfoForQa({
        consentDate: d.toISOString(),
        privacyPolicyVersion: consentInfo.privacyPolicyVersion,
      }),
    );
  };

  const onResetForConsentFresh = () => {
    dispatch(DANGEROUSLY_resetAnalyticsOptInStateForQa());
  };

  return (
    <Box grow shrink className="p-8 pb-16">
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button size="sm" appearance="no-background" onClick={onBack} icon={ArrowLeft}>
            {COPY.back}
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,28rem)] text-center text-base">
          {COPY.title}
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <Box className="mx-auto flex max-w-2xl flex-col gap-16 px-4">
        <section className="flex flex-col gap-8">
          <h2 className="body-2-semi-bold text-muted">{COPY.readSection}</h2>
          <div className="flex flex-col gap-8">
            <p className="body-2 leading-relaxed text-muted">
              {COPY.currentPrivacyVersion(String(policyVersion))}
            </p>
            <p className="body-2 leading-relaxed text-muted">
              {COPY.currentConsentValidityDays(consentValidityDays)}
            </p>
            <div className="flex flex-row flex-wrap items-center justify-between gap-10">
              <span
                className={`min-w-0 flex-1 body-2 font-medium leading-relaxed ${
                  needsPrivacy ? "text-error" : "text-success"
                }`}
              >
                {COPY.storedPrivacyVersion(
                  consentInfo.privacyPolicyVersion === null
                    ? "null"
                    : String(consentInfo.privacyPolicyVersion),
                )}
              </span>
              <Button
                className="shrink-0 self-center"
                size="sm"
                appearance="accent"
                onClick={onPrivacyOutdated}
              >
                {COPY.outdatePrivacyVersion}
              </Button>
            </div>
            <div className="flex flex-row flex-wrap items-center justify-between gap-10">
              <span
                className={`min-w-0 flex-1 body-2 font-medium leading-relaxed ${
                  needsRenewal ? "text-error" : "text-success"
                }`}
              >
                {COPY.consentDate(formatConsentDate(consentInfo.consentDate))}
              </span>
              <Button
                className="shrink-0 self-center"
                size="sm"
                appearance="accent"
                onClick={onSetConsentOneYearAgo}
              >
                {COPY.consentOneYearAgo}
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-32 flex flex-col gap-6 border-t border-muted-subtle pt-14">
          <h2 className="body-2-semi-bold text-muted">{COPY.modalSection}</h2>
          <p className={`body-2 font-medium leading-relaxed ${modalPreview.textClass}`}>
            {modalPreview.body}
          </p>
          <p className="body-3 leading-relaxed text-muted">{COPY.modalGoToHome}</p>
        </section>

        <section className="mt-32 flex flex-col gap-8">
          <Button size="sm" appearance="red" onClick={onResetForConsentFresh}>
            {COPY.resetForConsentFresh}
          </Button>
        </section>
      </Box>
    </Box>
  );
}
