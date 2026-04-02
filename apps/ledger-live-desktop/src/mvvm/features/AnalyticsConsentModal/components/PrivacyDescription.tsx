import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

export type PrivacyDescriptionProps = Readonly<{
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
}>;

export function PrivacyDescription({ privacyPolicyUrl, onOpenPrivacyPolicy }: PrivacyDescriptionProps) {
  const { t } = useTranslation();
  return (
    <p className="body-2 text-muted text-center">
      {t("analyticsConsentModal.privacy.descriptionLead")}
      <Link
        appearance="base"
        size="sm"
        href={privacyPolicyUrl}
        isExternal
        onClick={e => {
          e.preventDefault();
          onOpenPrivacyPolicy();
        }}
      >
        {t("analyticsConsentModal.privacy.descriptionLinkLabel")}
      </Link>
      {t("analyticsConsentModal.privacy.descriptionTrail")}
    </p>
  );
}
