import React from "react";
import { NewBannerCard } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { BaseStyledProps } from "@ledgerhq/native-ui/lib/components/styled";
import { useLNSUpsellBannerModel } from "./useLNSUpsellBannerModel";
import type { LNSBannerLocation, LNSBannerModel } from "./types";

type Props = BaseStyledProps & Readonly<{ location: LNSBannerLocation }>;

export function LNSUpsellBanner({ location, ...styledProps }: Props) {
  return <View {...styledProps} {...useLNSUpsellBannerModel(location)} location={location} />;
}

function View({
  location,
  isShown,
  tracking,
  handleCTAPress,
  ...styledProps
}: Props & LNSBannerModel) {
  const { t } = useTranslation();

  if (!isShown) return null;

  return (
    <NewBannerCard
      {...styledProps}
      description={t(`lnsUpsell.${tracking}.description`)}
      cta={t(`lnsUpsell.${tracking}.cta`)}
      icon={tracking === "opted_in" ? "SparksFill" : "Nano"}
      hasExternalLinkIcon
      onPress={handleCTAPress}
    />
  );
}
