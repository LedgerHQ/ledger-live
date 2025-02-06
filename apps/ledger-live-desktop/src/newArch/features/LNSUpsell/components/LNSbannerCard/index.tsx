import { t } from "i18next";
import { Trans } from "react-i18next";
import React from "react";
import { BannerCard, Text } from "@ledgerhq/react-ui";
import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import { openURL } from "~/renderer/linking";

type Props = Omit<FlexBoxProps, "maxHeight"> & {
  type: "optIn" | "optOut";
  location: "manager" | "accounts";
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
  ...boxProps
}: Props) {
  const handleCTAClick = () => openURL(ctaLink);
  const handleLearnMoreLink = () => openURL(learnMoreLink);

  return (
    <BannerCard
      {...boxProps}
      title={t(`lnsUpsell.banner.${location}.${type}.title`)}
      description={
        <Trans i18nKey={`lnsUpsell.banner.${location}.${type}.description`}>
          <Text color="constant.purple">{{ discount } as never}</Text>
        </Trans>
      }
      image={image}
      cta={t(`lnsUpsell.banner.${location}.${type}.cta`)}
      linkText={t(`lnsUpsell.banner.${location}.${type}.linkText`)}
      descriptionWidth={320}
      maxHeight={175}
      onClick={handleCTAClick}
      onLinkClick={handleLearnMoreLink}
    />
  );
}
