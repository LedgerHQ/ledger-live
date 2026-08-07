import React from "react";
import FastImage from "react-native-fast-image";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type { LazyOnboardingTourSlideContent } from "./content";

type LazyOnboardingTourSlideItemProps = LazyOnboardingTourSlideContent &
  Readonly<{
    isFirstSlide: boolean;
  }>;

export function LazyOnboardingTourSlideItem({
  image,
  imageAspectRatio,
  titleKey,
  subtitleKey,
}: LazyOnboardingTourSlideItemProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ flex: 1, alignItems: "center" }}>
      <Box
        lx={{
          flex: 1,
          width: "full",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: "s20",
        }}
      >
        <FastImage
          source={image}
          style={{ width: "80%", aspectRatio: imageAspectRatio }}
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
