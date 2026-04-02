import React from "react";
import { useTranslation } from "react-i18next";

export type ConsentFooterProps = Readonly<{
  onOpenPrivacyPolicy: () => void;
}>;

export function ConsentFooter({ onOpenPrivacyPolicy }: ConsentFooterProps) {
  const { t } = useTranslation();
  return (
    <p className="body-4 text-muted text-center">
      {t("analyticsConsentModal.footer.lead")}{" "}
      <button
        type="button"
        className="body-4 text-muted cursor-pointer bg-transparent p-0 underline underline-offset-2"
        onClick={onOpenPrivacyPolicy}
      >
        {t("analyticsConsentModal.footer.privacyLink")}
      </button>
    </p>
  );
}
