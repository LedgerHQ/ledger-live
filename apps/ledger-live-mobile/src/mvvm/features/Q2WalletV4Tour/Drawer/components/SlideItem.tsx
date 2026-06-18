import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated from "react-native-reanimated";
import { useSlideItemViewModel } from "../hooks/useSlideItemViewModel";

type SlideItemProps = Readonly<{
  index: number;
}>;

export function SlideItem({ index }: SlideItemProps) {
  const { title, subtitle, source, shouldRender, animatedStyle, textAnimatedStyle, handleLayout } =
    useSlideItemViewModel(index);

  return (
    <Animated.View onLayout={handleLayout} style={[styles.container, animatedStyle]}>
      <Box lx={{ flex: 1 }}>
        {shouldRender ? <Image source={source} style={styles.image} resizeMode="contain" /> : null}
      </Box>

      <Animated.View style={textAnimatedStyle} pointerEvents="none">
        <Box
          lx={{
            justifyContent: "center",
            minHeight: "s80",
          }}
        >
          <Text
            typography="heading3SemiBold"
            lx={{
              textAlign: "center",
              color: "base",
              marginBottom: "s8",
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </Box>

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
