import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated from "react-native-reanimated";
import { useSlideItemViewModel } from "../hooks/useSlideItemViewModel";
import type { WalletV4TourSlide, WalletV4TourTitleLayout } from "../types";

type SlideItemProps = Readonly<{
  index: number;
  slide: WalletV4TourSlide;
  titleLayout: WalletV4TourTitleLayout;
}>;

export function SlideItem({ index, slide, titleLayout }: SlideItemProps) {
  const { title, subtitle, source, shouldRender, animatedStyle, textAnimatedStyle, handleLayout } =
    useSlideItemViewModel(index, slide);

  const titleText = (
    <Text
      typography={titleLayout.typography}
      lx={{
        textAlign: "center",
        color: "base",
        marginTop: titleLayout.marginTop,
        marginBottom: "s8",
      }}
      numberOfLines={2}
    >
      {title}
    </Text>
  );

  return (
    <Animated.View onLayout={handleLayout} style={[styles.container, animatedStyle]}>
      <Box lx={{ flex: 1 }}>
        {shouldRender ? <Image source={source} style={styles.image} resizeMode="contain" /> : null}
      </Box>

      <Animated.View style={textAnimatedStyle} pointerEvents="none">
        {titleLayout.minHeight ? (
          <Box lx={{ justifyContent: "center", minHeight: titleLayout.minHeight }}>{titleText}</Box>
        ) : (
          titleText
        )}

        {subtitle ? (
          <Text
            typography="body2"
            lx={{
              color: "muted",
              textAlign: "center",
            }}
            numberOfLines={3}
          >
            {subtitle}
          </Text>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
