import { t } from "i18next";
import React from "react";
import { NotificationCard } from "@ledgerhq/react-ui";
import { AnalyticsButton, AnalyticsPage } from "LLD/features/LNSUpsell/types/enum/Analytics";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";

type Props = {
  type: "optIn" | "optOut";
  ctaLink: string;
  discount: number;
};

export function LNSNotificationCard({ type, ctaLink, discount }: Props) {
  const handleClick = () => {
    track("button_clicked", {
      button: AnalyticsButton.CTA,
      link: ctaLink,
      page: AnalyticsPage.NotificationPanel,
    });
    openURL(ctaLink);
  };

  return (
    <NotificationCard
      description={t(`lnsUpsell.banner.notifications.${type}.description`, { discount })}
      cta={t(`lnsUpsell.banner.notifications.${type}.cta`)}
      icon="SparksFill"
      onClick={handleClick}
      isHighlighted
    />
  );
}
