import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import type { AnalyticsConsentPhase } from "@ledgerhq/live-common/analyticsConsent/index";
import { DescriptionWithPreferencesLink } from "./DescriptionWithPreferencesLink";
import { PrivacyDescription } from "./PrivacyDescription";

export type AnalyticsConsentDialogCopyBlockProps = Readonly<{
  phase: AnalyticsConsentPhase;
  descriptionLead: string | null;
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
  onSetPreferences: () => void;
}>;

export function AnalyticsConsentDialogCopyBlock({
  phase,
  descriptionLead,
  privacyPolicyUrl,
  onOpenPrivacyPolicy,
  onSetPreferences,
}: AnalyticsConsentDialogCopyBlockProps) {
  const { t } = useTranslation();

  const getTitle = () => {
    if (phase === "consentReconfirm") {
      return t("analyticsConsentModal.reconfirm.title");
    } else if (phase === "privacy") {
      return t("analyticsConsentModal.privacy.title");
    } else {
      return t("analyticsConsentModal.fresh.title");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-8 text-center">
      <DialogTitle className="heading-4-semi-bold text-base w-full">{getTitle()}</DialogTitle>
      {phase === "privacy" ? (
        <PrivacyDescription
          privacyPolicyUrl={privacyPolicyUrl}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        />
      ) : (
        descriptionLead != null && (
          <DescriptionWithPreferencesLink
            text={descriptionLead}
            onSetPreferences={onSetPreferences}
          />
        )
      )}
    </div>
  );
}
