import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

export type PrivacyDescriptionProps = Readonly<{
  onOpenPrivacyPolicy: () => void;
}>;

export function PrivacyDescription({ onOpenPrivacyPolicy }: PrivacyDescriptionProps) {
  const { t } = useTranslation();
  return (
    <p className="body-2 text-muted text-center">
      {t("analyticsConsentModal.privacy.descriptionLead")}
      <Link asChild appearance="base" size="sm">
        <button type="button" onClick={onOpenPrivacyPolicy}>
          {t("analyticsConsentModal.privacy.descriptionLinkLabel")}
        </button>
      </Link>
      {t("analyticsConsentModal.privacy.descriptionTrail")}
    </p>
  );
}
