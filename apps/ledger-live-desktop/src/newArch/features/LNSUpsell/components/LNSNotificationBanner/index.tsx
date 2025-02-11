import { t } from "i18next";
import React from "react";
import { NotificationCard } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { AnalyticsButton, AnalyticsPage, type LNSUpsellType } from "../../types";

type Props = {
  type: LNSUpsellType;
  ctaLink: string;
  discount: number;
};

export function LNSNotificationBanner({ type, ctaLink, discount }: Readonly<Props>) {
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
