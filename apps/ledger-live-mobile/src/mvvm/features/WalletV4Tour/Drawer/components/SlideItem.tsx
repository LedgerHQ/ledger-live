import React, { useCallback, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { Box, Text, useSlidesContext } from "@ledgerhq/native-ui";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";

interface SlideItemProps {
  title: string;
  description: string;
  index: number;
}

export function SlideItem({ title, description, index }: SlideItemProps) {
  const { scrollProgressSharedValue } = useSlidesContext();
  const [slideWidth, setSlideWidth] = useState(0);

  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setSlideWidth(layout.width);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = scrollProgressSharedValue.value;
    return {
      opacity: interpolate(progress, [index - 1, index, index + 1], [0, 1, 0]),
      transform: [
        {
          translateX: interpolate(
            progress,
            [index - 1, index, index + 1],
            [-slideWidth, 0, slideWidth],
          ),
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue.value]);

  return (
    <Animated.View onLayout={handleLayout} style={[animatedStyle, { flex: 1 }]}>
      <Box flex={1} marginBottom={40} alignItems="center" justifyContent="center">
        <Box width={300} height={400} backgroundColor="neutral.c40" />
      </Box>

      <Text variant="h4" textAlign="center" mb={4} fontWeight="bold" numberOfLines={1}>
        {title}
      </Text>

      <Text variant="body" textAlign="center" color="neutral.c70" px={4} numberOfLines={2}>
        {description}
      </Text>
    </Animated.View>
  );
}
