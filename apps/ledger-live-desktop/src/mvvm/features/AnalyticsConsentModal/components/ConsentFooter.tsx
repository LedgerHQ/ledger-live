import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

export type ConsentFooterProps = Readonly<{
  onOpenPrivacyPolicy: () => void;
}>;

export function ConsentFooter({ onOpenPrivacyPolicy }: ConsentFooterProps) {
  const { t } = useTranslation();
  return (
    <p className="body-4 text-muted text-center">
      {t("analyticsConsentModal.footer.lead")}{" "}
      <Link asChild appearance="inherit" size="inherit">
        <button type="button" onClick={onOpenPrivacyPolicy}>
          {t("analyticsConsentModal.footer.privacyLink")}
        </button>
      </Link>
    </p>
  );
}
