import React from "react";
import { StyleSheet } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { useSlideItemViewModel } from "../hooks/useSlideItemViewModel";

type SlideItemProps = {
  readonly index: number;
};

export function SlideItem({ index }: SlideItemProps) {
  const {
    isActive,
    shouldRender,
    source,
    lottieSrc,
    title,
    subTitle,
    textAnimatedStyle,
    animatedStyle,
    handleLayout,
  } = useSlideItemViewModel(index);

  return (
    <Animated.View onLayout={handleLayout} style={[styles.container, animatedStyle]}>
      {shouldRender && isActive ? (
        <LottieView
          key={`${lottieSrc}-${index}-animation`}
          autoPlay
          loop={false}
          style={styles.lottie}
          source={source}
        />
      ) : (
        <LottieView
          key={`${lottieSrc}-${index}-placeholder`}
          autoPlay={false}
          loop={false}
          style={styles.lottie}
          source={source}
        />
      )}

      <Animated.View style={textAnimatedStyle} pointerEvents="none">
        <Box lx={{ justifyContent: "center", minHeight: "s80", gap: "s8", alignItems: "center" }}>
          <Text
            typography="heading4SemiBold"
            lx={{ textAlign: "center", color: "base" }}
            numberOfLines={2}
          >
            {title}
          </Text>

          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }} numberOfLines={2}>
            {subTitle}
          </Text>
        </Box>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 48,
  },
  lottie: {
    width: "100%",
    height: 300,
  },
});
