import { t } from "i18next";
import React from "react";
import { NotificationCard } from "@ledgerhq/react-ui";
import { useLNSBanner } from "../../hooks/useLNSBanner";

export function LNSNotificationBanner() {
  const params = useLNSBanner("notification_center");

  if (!params) return null;

  const { discount, tracking, handleCTAClick } = params;

  return (
    <NotificationCard
      description={t(`lnsUpsell.banner.notifications.${tracking}.description`, { discount })}
      cta={t(`lnsUpsell.banner.notifications.${tracking}.cta`)}
      icon="SparksFill"
      onClick={handleCTAClick}
      isHighlighted
    />
  );
}
