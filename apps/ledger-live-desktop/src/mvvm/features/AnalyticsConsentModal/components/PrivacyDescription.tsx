import React from "react";
import { useTranslation } from "react-i18next";

export type PrivacyDescriptionProps = Readonly<{
  onOpenPrivacyPolicy: () => void;
}>;

export function PrivacyDescription({ onOpenPrivacyPolicy }: PrivacyDescriptionProps) {
  const { t } = useTranslation();
  return (
    <p className="body-2 text-muted text-center">
      {t("analyticsConsentModal.privacy.descriptionLead")}
      <button
        type="button"
        className="body-2 cursor-pointer bg-transparent p-0 underline underline-offset-2"
        onClick={onOpenPrivacyPolicy}
      >
        {t("analyticsConsentModal.privacy.descriptionLinkLabel")}
      </button>
      {t("analyticsConsentModal.privacy.descriptionTrail")}
    </p>
  );
}
