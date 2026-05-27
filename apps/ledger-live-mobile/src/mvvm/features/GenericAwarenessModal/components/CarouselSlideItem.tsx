import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import type { GenericAwarenessModalCarouselSlide } from "@ledgerhq/live-common/genericAwarenessModal";

const TITLE_NUMBER_OF_LINES = 2;
const SUBTITLE_NUMBER_OF_LINES = 3;

type CarouselSlideItemProps = GenericAwarenessModalCarouselSlide &
  Readonly<{
    isFirstSlide: boolean;
    titleLineCount: number;
    onTitleTextLayout: (lineCount: number) => void;
    subtitleLineCount: number;
    onSubtitleTextLayout: (lineCount: number) => void;
  }>;

export function CarouselSlideItem({
  imageUrl,
  title,
  subtitle,
  isFirstSlide,
  titleLineCount,
  onTitleTextLayout,
  subtitleLineCount,
  onSubtitleTextLayout,
}: CarouselSlideItemProps) {
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
      <Box lx={{ flex: 1, alignItems: "center", justifyContent: "flex-end", marginBottom: "s20" }}>
        <FastImage
          source={{
            uri: imageUrl,
            priority: isFirstSlide ? FastImage.priority.high : FastImage.priority.normal,
          }}
          style={styles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
      </Box>
      <Box
        lx={{
          justifyContent: "flex-end",
          minHeight: titleMinHeight,
        }}
      >
        <Text
          typography="heading2SemiBold"
          lx={{
            textAlign: "center",
            color: "base",
            marginBottom: titleLineCount > 1 ? "s10" : "s4",
          }}
          numberOfLines={TITLE_NUMBER_OF_LINES}
          onTextLayout={event => {
            onTitleTextLayout(Math.min(event.nativeEvent.lines.length, TITLE_NUMBER_OF_LINES));
          }}
        >
          {title}
        </Text>
      </Box>
      <Box lx={{ minHeight: subtitleMinHeight, justifyContent: "flex-start" }}>
        <Text
          typography="body2"
          lx={{ color: "muted", textAlign: "center" }}
          numberOfLines={SUBTITLE_NUMBER_OF_LINES}
          onTextLayout={event => {
            onSubtitleTextLayout(
              Math.min(event.nativeEvent.lines.length, SUBTITLE_NUMBER_OF_LINES),
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
    aspectRatio: 9 / 16,
  },
});
