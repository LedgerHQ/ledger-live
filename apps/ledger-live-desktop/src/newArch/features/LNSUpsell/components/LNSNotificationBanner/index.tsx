import { t } from "i18next";
import React from "react";
import { NotificationCard } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";

type Props = {
  type: "optIn" | "optOut";
  ctaLink: string;
  discount: number;
};

export function LNSNotificationCard({ type, ctaLink, discount }: Props) {
  const handleClick = () => openURL(ctaLink);
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
