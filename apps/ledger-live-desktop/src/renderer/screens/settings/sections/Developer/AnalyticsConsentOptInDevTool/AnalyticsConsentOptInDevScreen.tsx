import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

  const modalPreview = (() => {
    if (!hasCompletedOnboarding) {
      return {
        messageKey: "modalPreviewNoModalOnboarding" as const,
        textClass: "text-muted" as const,
      };
    }
    if (!analyticsOptInFeature?.enabled) {
      return {
        messageKey: "modalPreviewNoModalFeatureOff" as const,
        textClass: "text-muted" as const,
      };
    }
    if (!shouldOfferModal) {
      return {
        messageKey: "modalPreviewNoModalUserOk" as const,
        textClass: "text-success" as const,
      };
    }
    if (modalPhaseIfOffered === "consentReconfirm") {
      return {
        messageKey: "modalPreviewReconfirm" as const,
        textClass: "text-interactive" as const,
      };
    }
    if (modalPhaseIfOffered === "consentFresh") {
      return { messageKey: "modalPreviewFresh" as const, textClass: "text-interactive" as const };
    }
    if (modalPhaseIfOffered === "privacy") {
      return { messageKey: "modalPreviewPrivacy" as const, textClass: "text-interactive" as const };
    }
    return { messageKey: "modalPreviewNoModalUserOk" as const, textClass: "text-success" as const };
  })();

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

  const onResetForConsentFresh = () => {
    dispatch(DANGEROUSLY_resetAnalyticsOptInStateForQa());
  };

  return (
    <Box grow shrink className="p-8 pb-16">
      <header className="mb-14 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-6">
        <div className="flex min-w-0 justify-start">
          <Button size="sm" appearance="no-background" onClick={onBack} icon={ArrowLeft}>
            {t("common.back")}
          </Button>
        </div>
        <span className="heading-2-semi-bold max-w-[min(100vw-8rem,28rem)] text-center text-base">
          {t("settings.developer.analyticsConsentOptInQa.title")}
        </span>
        <div aria-hidden className="min-w-0" />
      </header>

      <Box className="mx-auto flex max-w-2xl flex-col gap-16 px-4">
        <section className="flex flex-col gap-8">
          <h2 className="body-2-semi-bold text-muted">
            {t("settings.developer.analyticsConsentOptInQa.readSection")}
          </h2>
          <div className="flex flex-col gap-8">
            <p className="body-2 leading-relaxed text-muted">
              {t("settings.developer.analyticsConsentOptInQa.currentPrivacyVersion", {
                version: String(CURRENT_PRIVACY_POLICY_VERSION),
              })}
            </p>
            <div className="flex flex-row flex-wrap items-center justify-between gap-10">
              <span
                className={`min-w-0 flex-1 body-2 font-medium leading-relaxed ${
                  needsPrivacy ? "text-error" : "text-success"
                }`}
              >
                {t("settings.developer.analyticsConsentOptInQa.storedPrivacyVersion", {
                  version:
                    consentInfo.privacyPolicyVersion === null
                      ? "null"
                      : String(consentInfo.privacyPolicyVersion),
                })}
              </span>
              <Button
                className="shrink-0 self-center"
                size="sm"
                appearance="accent"
                onClick={onPrivacyOutdated}
              >
                {t("settings.developer.analyticsConsentOptInQa.inlineOutdatePrivacyVersion")}
              </Button>
            </div>
            <div className="flex flex-row flex-wrap items-center justify-between gap-10">
              <span
                className={`min-w-0 flex-1 body-2 font-medium leading-relaxed ${
                  needsRenewal ? "text-error" : "text-success"
                }`}
              >
                {t("settings.developer.analyticsConsentOptInQa.consentDate", {
                  value: formatConsentDate(consentInfo.consentDate),
                })}
              </span>
              <Button
                className="shrink-0 self-center"
                size="sm"
                appearance="accent"
                onClick={onRemoveConsentDate}
              >
                {t("settings.developer.analyticsConsentOptInQa.inlineRemoveConsentDate")}
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-32 flex flex-col gap-6 border-t border-muted-subtle pt-14">
          <h2 className="body-2-semi-bold text-muted">
            {t("settings.developer.analyticsConsentOptInQa.modalPreviewSection")}
          </h2>
          <p className={`body-2 font-medium leading-relaxed ${modalPreview.textClass}`}>
            {t(`settings.developer.analyticsConsentOptInQa.${modalPreview.messageKey}`)}
          </p>
          <p className="body-3 leading-relaxed text-muted">
            {t("settings.developer.analyticsConsentOptInQa.modalPreviewGoToHome")}
          </p>
        </section>

        <section className="mt-32 flex flex-col gap-8">
          <Button size="sm" appearance="red" onClick={onResetForConsentFresh}>
            {t("settings.developer.analyticsConsentOptInQa.actionResetForConsentFresh")}
          </Button>
          <p className="max-w-xl leading-relaxed body-3 text-muted">
            {t("settings.developer.analyticsConsentOptInQa.note")}
          </p>
        </section>
      </Box>
    </Box>
  );
}
