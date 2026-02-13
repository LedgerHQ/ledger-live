import React, { useCallback, useState } from "react";
import { Platform, type LayoutChangeEvent } from "react-native";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { WalletV4TourSlide } from "../types";

type SlideItemProps = WalletV4TourSlide & { index: number };

export function SlideItem({ title, description, index, lottieSrc }: SlideItemProps) {
  const { scrollProgressSharedValue, currentIndex } = useSlidesContext();

  const isActive = currentIndex === index;

  const [slideWidth, setSlideWidth] = useState(0);

  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setSlideWidth(layout.width);
  }, []);

  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    const progress = scrollProgressSharedValue.value;
    if (reduceMotion) {
      return {};
    }
    const THRESHOLD = 0.6;
    return {
      opacity: interpolate(
        progress,
        [index - THRESHOLD, index, index + THRESHOLD],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            [index - THRESHOLD, index, index + THRESHOLD],
            // on android, we need a lower distance otherwise the animation is janky.
            Platform.OS === "android"
              ? [-slideWidth * 0.15, 0, slideWidth * 0.15]
              : [-slideWidth * 0.3, 0, slideWidth * 0.3],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            progress,
            [index - THRESHOLD, index, index + THRESHOLD],
            [0.98, 1, 0.98],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion]);

  const textAnimatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }
    const STAGGGER_THRESHOLD = 0.5;
    const progress = scrollProgressSharedValue.value;
    return {
      opacity: interpolate(
        progress,
        [index - 1 + STAGGGER_THRESHOLD, index, index + 1 - STAGGGER_THRESHOLD],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            [index - STAGGGER_THRESHOLD, index, index + STAGGGER_THRESHOLD],
            [slideWidth * 0.05, 0, -slideWidth * 0.05],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion]);

  return (
    <Animated.View onLayout={handleLayout} style={[animatedStyle, { flex: 1 }]}>
      <Box
        lx={{
          flex: 1,
          marginTop: "-s40",
        }}
      >
        <LottieView
          autoPlay={isActive}
          loop={false}
          style={{ width: "100%", height: "100%" }}
          // LottieView actually can resolve a number that is an assetId.
          source={lottieSrc as unknown as string}
          speed={1.5}
        />
      </Box>

      <Animated.View style={textAnimatedStyle} pointerEvents="none">
        <Text
          typography="heading2SemiBold"
          lx={{
            textAlign: "center",
            color: "base",
            marginBottom: "s8",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          typography="body2"
          lx={{
            color: "muted",
            textAlign: "center",
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
