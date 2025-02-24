import { t } from "i18next";
import React from "react";
import { NotificationCard } from "@ledgerhq/react-ui";
import type { LNSBannerModel } from "../../types";

type Props = Readonly<{
  model: Pick<LNSBannerModel, "discount" | "tracking" | "handleCTAClick"> | null;
}>;

export function LNSNotificationBanner({ model }: Props) {
  if (!model) return null;

  const { discount, tracking, handleCTAClick } = model;

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
