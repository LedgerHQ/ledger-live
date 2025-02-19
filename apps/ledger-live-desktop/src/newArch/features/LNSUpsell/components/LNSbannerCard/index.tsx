import { t } from "i18next";
import { Trans } from "react-i18next";
import React from "react";
import { BannerCard, Text } from "@ledgerhq/react-ui";
import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { AnalyticsButton, AnalyticsPage, type LNSUpsellType } from "../../types";

type Location = "manager" | "accounts";
type Props = FlexBoxProps & {
  type: LNSUpsellType;
  location: Location;
  image: string;
  ctaLink: string;
  learnMoreLink: string;
  discount: number;
};

export function LNSBannerCard({
  type,
  location,
  image,
  ctaLink,
  learnMoreLink,
  discount,
  borderRadius = "5px",
  maxHeight = 175,
  ...boxProps
}: Props) {
  const handleCTAClick = () => {
    track("button_clicked", {
      button: AnalyticsButton.CTA,
      link: ctaLink,
      page: AnalyticsPageMap[location],
    });
    openURL(ctaLink);
  };
  const handleLearnMoreLink = () => {
    track("button_clicked", {
      button: AnalyticsButton.LearnMore,
      link: learnMoreLink,
      page: AnalyticsPageMap[location],
    });
    openURL(learnMoreLink);
  };

  return (
    <BannerCard
      {...boxProps}
      title={t(`lnsUpsell.banner.${location}.${type}.title`)}
      description={
        <Trans i18nKey={`lnsUpsell.banner.${location}.${type}.description`} values={{ discount }}>
          <Text color="constant.purple" />
        </Trans>
      }
      image={image}
      cta={t(`lnsUpsell.banner.${location}.${type}.cta`)}
      linkText={t(`lnsUpsell.banner.${location}.${type}.linkText`)}
      descriptionWidth={320}
      maxHeight={maxHeight}
      borderRadius={borderRadius}
      onClick={handleCTAClick}
      onLinkClick={handleLearnMoreLink}
    />
  );
}

const AnalyticsPageMap: Record<Location, AnalyticsPage> = {
  manager: AnalyticsPage.Manager,
  accounts: AnalyticsPage.Accounts,
};
