import React from "react";
import { StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated from "react-native-reanimated";
import { useSlideItemViewModel } from "../hooks/useSlideItemViewModel";

type SlideItemProps = {
  readonly index: number;
};

export function SlideItem({ index }: SlideItemProps) {
  const { isActive, shouldRender, source, textAnimatedStyle, animatedStyle, handleLayout } =
    useSlideItemViewModel(index);

  return (
    <Animated.View onLayout={handleLayout} style={[styles.container, animatedStyle]}>
      {shouldRender && isActive ? (
        <React.Fragment key={`product-tour-${index}-animation`}>
          <LottieView autoPlay loop={false} style={styles.lottie} source={source} />
        </React.Fragment>
      ) : (
        <React.Fragment key={`product-tour-${index}-placeholder`}>
          <LottieView autoPlay={false} loop={false} style={styles.lottie} source={source} />
        </React.Fragment>
      )}

      <Animated.View style={textAnimatedStyle} pointerEvents="none">
        <Box lx={{ justifyContent: "center", minHeight: "s80", gap: "s8", alignItems: "center" }}>
          <Text
            typography="heading4SemiBold"
            lx={{ textAlign: "center", color: "base" }}
            numberOfLines={2}
          >
            {`Slide ${index + 1} title`}
          </Text>

          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }} numberOfLines={2}>
            {`Slide ${index + 1} description`}
          </Text>
        </Box>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    alignSelf: "stretch",
  },
  lottie: {
    display: "flex",
    width: 208,
    height: 208,
    justifyContent: "center",
    alignItems: "center",
  },
});
