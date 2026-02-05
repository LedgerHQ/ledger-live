import React, { useCallback, useState } from "react";
import { type LayoutChangeEvent } from "react-native";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";

interface SlideItemProps {
  readonly title: string;
  readonly description: string;
  readonly index: number;
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
      <Box
        lx={{
          flex: 1,
          marginBottom: "s40",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          lx={{
            width: "s256",
            height: "s320",
            backgroundColor: "active",
          }}
        />
      </Box>

      <Text
        typography="heading2SemiBold"
        lx={{
          textAlign: "center",
          marginBottom: "s4",
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        typography="body2"
        lx={{
          marginTop: "s8",
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {description}
      </Text>
    </Animated.View>
  );
}
