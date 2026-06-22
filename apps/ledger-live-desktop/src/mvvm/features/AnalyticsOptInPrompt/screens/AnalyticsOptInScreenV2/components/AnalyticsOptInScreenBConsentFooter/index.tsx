import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

export type AnalyticsOptInScreenBConsentFooterProps = Readonly<{
  onOpenTrackingPolicy: () => void;
}>;

export function AnalyticsOptInScreenBConsentFooter({
  onOpenTrackingPolicy,
}: AnalyticsOptInScreenBConsentFooterProps) {
  const { t } = useTranslation();

  return (
    <p className="body-4 text-grey text-center">
      <span>{t("analyticsOptInScreenB.footer.lead")} </span>
      <Link
        onClick={onOpenTrackingPolicy}
        href="#"
        appearance="accent"
        size="sm"
        underline
        style={{ padding: 0 }}
      >
        {t("analyticsOptInScreenB.footer.trackingPolicyLink")}
      </Link>
    </p>
  );
}
