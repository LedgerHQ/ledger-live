import React from "react";
import { Box, NewBannerCard } from "@ledgerhq/native-ui";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useTranslation } from "~/context/Locale";
import { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { LNSUpsellMediaBanner } from "./LNSUpsellMediaBanner";
import { useLNSUpsellBannerModel } from "./useLNSUpsellBannerModel";
import type { LNSBannerLocation, LNSBannerModel } from "../../types";

type Props = BaseStyledProps & Readonly<{ location: LNSBannerLocation }>;

export function LNSUpsellBanner({ location, ...styledProps }: Props) {
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("mobile");
  const model = useLNSUpsellBannerModel(location);
  return (
    <View
      {...styledProps}
      {...model}
      shouldUseLumenMediaBanner={shouldDisplayBrazePlacement}
    />
  );
}

function View({
  isShown,
  tracking,
  handleCTAPress,
  imageUrl,
  shouldUseLumenMediaBanner,
  ...styledProps
}: BaseStyledProps &
  LNSBannerModel & {
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
        <LNSUpsellMediaBanner
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
