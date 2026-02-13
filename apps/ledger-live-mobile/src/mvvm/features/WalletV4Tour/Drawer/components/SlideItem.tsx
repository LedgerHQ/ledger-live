import React, { useCallback, useDeferredValue, useState } from "react";
import { StyleSheet, type LayoutChangeEvent } from "react-native";
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

export function SlideItem({ title, description, index, lottieSrc, speed }: SlideItemProps) {
  const { scrollProgressSharedValue, currentIndex } = useSlidesContext();

  // for some reason, iOS needs a deferred value. Otherwise, 3rd animation already starts and then starts again from the beginning.
  const deferredCurrentIndex = useDeferredValue(currentIndex);
  const isActive = deferredCurrentIndex === index;

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
            [-slideWidth * 0.2, 0, slideWidth * 0.2],
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
    const STAGGER_THRESHOLD = 0.5;
    const progress = scrollProgressSharedValue.value;
    return {
      opacity: interpolate(
        progress,
        [index - 1 + STAGGER_THRESHOLD, index, index + 1 - STAGGER_THRESHOLD],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            [index - STAGGER_THRESHOLD, index, index + STAGGER_THRESHOLD],
            [slideWidth * 0.05, 0, -slideWidth * 0.05],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion]);

  const shouldRender = Math.abs(deferredCurrentIndex - index) <= 1;

  // LottieView actually can resolve a number that is an assetId.
  const source = lottieSrc as unknown as string;
  return (
    <Animated.View onLayout={handleLayout} style={[animatedStyle, { flex: 1 }]}>
      <Box
        lx={{
          flex: 1,
          marginBottom: "s40",
        }}
      >
        {shouldRender && isActive ? (
          <LottieView
            key={`${lottieSrc}-${index}-animation`}
            autoPlay
            loop={false}
            style={styles.lottie}
            source={source}
            speed={speed}
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

const styles = StyleSheet.create({
  lottie: {
    width: "100%",
    height: "100%",
  },
});
