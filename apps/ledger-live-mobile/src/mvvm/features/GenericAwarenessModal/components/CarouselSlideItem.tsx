import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import type { GenericAwarenessModalCarouselSlide } from "@ledgerhq/live-common/genericAwarenessModal";
import { useThemedAwarenessModalImage } from "../hooks/useThemedAwarenessModalImage";
import { CAROUSEL_SLIDE_TEXT_LINE_LIMITS } from "../textLineLimits";

type CarouselSlideItemProps = GenericAwarenessModalCarouselSlide &
  Readonly<{
    isFirstSlide: boolean;
    titleLineCount: number;
    onTitleTextLayout: (lineCount: number) => void;
    subtitleLineCount: number;
    onSubtitleTextLayout: (lineCount: number) => void;
  }>;

export function CarouselSlideItem({
  imageUrlLight,
  imageUrlDark,
  title,
  subtitle,
  isFirstSlide,
  titleLineCount,
  onTitleTextLayout,
  subtitleLineCount,
  onSubtitleTextLayout,
}: CarouselSlideItemProps) {
  const { imageUrl, showImage } = useThemedAwarenessModalImage({ imageUrlLight, imageUrlDark });
  const titleNumberOfLines = CAROUSEL_SLIDE_TEXT_LINE_LIMITS.title;
  const titleMinHeight = titleLineCount > 1 ? "s80" : "s40";
  let subtitleMinHeight: "s20" | "s40" | "s64" = "s20";
  if (subtitleLineCount > 2) {
    subtitleMinHeight = "s64";
  } else if (subtitleLineCount > 1) {
    subtitleMinHeight = "s40";
  }

  return (
    <Box
      lx={{
        flex: 1,
        marginBottom: titleLineCount === 1 || subtitleLineCount === 1 ? "s8" : undefined,
      }}
    >
      {showImage ? (
        <Box
          lx={{ flex: 1, alignItems: "center", justifyContent: "flex-end", marginBottom: "s20" }}
        >
          <FastImage
            source={{
              uri: imageUrl,
              priority: isFirstSlide ? FastImage.priority.high : FastImage.priority.normal,
            }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
        </Box>
      ) : null}
      <Box
        lx={{
          justifyContent: "flex-end",
          minHeight: titleMinHeight,
        }}
      >
        <Text
          typography="heading3SemiBold"
          lx={{
            textAlign: "center",
            color: "base",
            marginBottom: titleLineCount > 1 ? "s10" : "s4",
          }}
          numberOfLines={titleNumberOfLines}
          onTextLayout={event => {
            onTitleTextLayout(Math.min(event.nativeEvent.lines.length, titleNumberOfLines));
          }}
        >
          {title}
        </Text>
      </Box>
      <Box lx={{ minHeight: subtitleMinHeight, justifyContent: "flex-start" }}>
        <Text
          typography="body2"
          lx={{ color: "muted", textAlign: "center" }}
          numberOfLines={CAROUSEL_SLIDE_TEXT_LINE_LIMITS.subtitle}
          onTextLayout={event => {
            onSubtitleTextLayout(
              Math.min(event.nativeEvent.lines.length, CAROUSEL_SLIDE_TEXT_LINE_LIMITS.subtitle),
            );
          }}
        >
          {subtitle}
        </Text>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "80%",
    aspectRatio: 2 / 3,
  },
});
