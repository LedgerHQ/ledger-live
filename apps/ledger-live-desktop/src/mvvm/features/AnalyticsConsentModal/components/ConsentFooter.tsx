import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

export type ConsentFooterProps = Readonly<{
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
}>;

export function ConsentFooter({ privacyPolicyUrl, onOpenPrivacyPolicy }: ConsentFooterProps) {
  const { t } = useTranslation();
  return (
    <p className="body-4 text-muted text-center">
      {t("analyticsConsentModal.footer.lead")}{" "}
      <Link
        appearance="inherit"
        size="inherit"
        href={privacyPolicyUrl}
        onClick={e => {
          e.preventDefault();
          onOpenPrivacyPolicy();
        }}
      >
        {t("analyticsConsentModal.footer.privacyLink")}
      </Link>
    </p>
  );
}
