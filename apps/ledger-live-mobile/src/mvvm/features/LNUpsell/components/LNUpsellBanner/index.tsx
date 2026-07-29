import React from "react";
import { Box, NewBannerCard } from "@ledgerhq/native-ui";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useTranslation } from "~/context/Locale";
import { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { LNUpsellMediaBanner } from "./LNUpsellMediaBanner";
import { useLNUpsellBannerModel } from "./useLNUpsellBannerModel";
import type { LNBannerLocation, LNBannerModel } from "../../types";

type Props = BaseStyledProps & Readonly<{ location: LNBannerLocation }>;

export function LNUpsellBanner({ location, ...styledProps }: Props) {
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("mobile");
  const model = useLNUpsellBannerModel(location);
  return (
    <View {...styledProps} {...model} shouldUseLumenMediaBanner={shouldDisplayBrazePlacement} />
  );
}

function View({
  location: _location,
  isShown,
  tracking,
  handleCTAPress,
  imageUrl,
  shouldUseLumenMediaBanner,
  ...styledProps
}: BaseStyledProps &
  LNBannerModel & {
    shouldUseLumenMediaBanner: boolean;
  }) {
  const { t } = useTranslation();

  if (!isShown) return null;

  const title = t(`lnsUpsell.${tracking}.title`);
  const description = t(`lnsUpsell.${tracking}.description`);
  const cta = t(`lnsUpsell.${tracking}.cta`);

  if (shouldUseLumenMediaBanner) {
    return (
      <Box {...styledProps}>
        <LNUpsellMediaBanner
          title={title}
          description={description}
          imageUrl={imageUrl}
          onPress={handleCTAPress}
        />
      </Box>
    );
  }

  return (
    <NewBannerCard
      {...styledProps}
      variant="titleProminent"
      title={title}
      description={description}
      cta={cta}
      icon={tracking === "opted_in" ? "SparksFill" : "Nano"}
      hasExternalLinkIcon
      onPress={handleCTAPress}
    />
  );
}
