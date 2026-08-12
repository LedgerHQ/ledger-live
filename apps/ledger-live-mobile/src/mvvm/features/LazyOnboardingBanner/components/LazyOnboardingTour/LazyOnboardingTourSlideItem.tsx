import React from "react";
import FastImage from "react-native-fast-image";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type { LazyOnboardingTourSlideContent } from "./content";

type LazyOnboardingTourSlideItemProps = LazyOnboardingTourSlideContent;

export function LazyOnboardingTourSlideItem({
  image,
  titleKey,
  subtitleKey,
}: LazyOnboardingTourSlideItemProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ flex: 1, alignItems: "center" }}>
      {/* Fills exactly the space left over by the title/subtitle below, so the image is
      as large as possible on every screen size without ever pushing the text out of view. */}
      <Box lx={{ flex: 1, width: "full", marginBottom: "s20" }}>
        <FastImage
          source={image}
          style={{ width: "100%", height: "100%" }}
          resizeMode={FastImage.resizeMode.cover}
        />
      </Box>
      <Text
        typography="heading3SemiBold"
        lx={{ textAlign: "center", color: "base", marginBottom: "s8" }}
        numberOfLines={2}
      >
        {t(titleKey)}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }} numberOfLines={3}>
        {t(subtitleKey)}
      </Text>
    </Box>
  );
}
