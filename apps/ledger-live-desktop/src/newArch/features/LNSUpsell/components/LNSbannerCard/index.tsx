import { t } from "i18next";
import { Trans } from "react-i18next";
import React from "react";
import { BannerCard, Text } from "@ledgerhq/react-ui";
import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import { useLNSBanner } from "../../hooks/useLNSBanner";
import { type LNSBannerLocation } from "../../types";

type Props = FlexBoxProps & { location: Extract<LNSBannerLocation, "accounts" | "manager"> };

export function LNSBannerCard({
  location,
  maxHeight = 175,
  borderRadius = "5px",
  ...boxProps
}: Props) {
  const params = useLNSBanner(location);

  if (!params) return null;

  const { discount, image, tracking, handleCTAClick, handleLearnMoreLink } = params;

  return (
    <BannerCard
      {...boxProps}
      title={t(`lnsUpsell.banner.${location}.${tracking}.title`)}
      description={
        <Trans
          i18nKey={`lnsUpsell.banner.${location}.${tracking}.description`}
          values={{ discount }}
        >
          <Text color="constant.purple" />
        </Trans>
      }
      image={image}
      cta={t(`lnsUpsell.banner.${location}.${tracking}.cta`)}
      linkText={t(`lnsUpsell.banner.${location}.${tracking}.linkText`)}
      descriptionWidth={320}
      maxHeight={maxHeight}
      borderRadius={borderRadius}
      onClick={handleCTAClick}
      onLinkClick={handleLearnMoreLink}
    />
  );
}
