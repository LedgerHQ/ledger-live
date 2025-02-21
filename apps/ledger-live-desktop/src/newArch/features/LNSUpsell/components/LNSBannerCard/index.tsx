import { t } from "i18next";
import { Trans } from "react-i18next";
import React from "react";
import { BannerCard, Text } from "@ledgerhq/react-ui";
import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import type { LNSBannerModel } from "../../types";

type Props = FlexBoxProps & { model: LNSBannerModel | null };

export function LNSBannerCard({
  model,
  maxHeight = 175,
  borderRadius = "5px",
  ...boxProps
}: Props) {
  if (!model) return null;

  const { location, discount, image, tracking, handleCTAClick, handleLearnMoreLink } = model;

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
