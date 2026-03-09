import React, { useCallback, useDeferredValue, useState } from "react";
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
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

type SlideItemProps = WalletV4TourSlide & { index: number };

export function SlideItem({ title, description, index, lottieSrc, speed }: SlideItemProps) {
  const { scrollProgressSharedValue, currentIndex } = useSlidesContext();
  const styles = useStyleSheet(
    () => ({
      lottie: {
        width: "100%",
        height: "100%",
      },
    }),
    [],
  );

  // for some reason, iOS needs a deferred value. Otherwise, 3rd animation already starts and then starts again from the beginning.
  const deferredCurrentIndex = useDeferredValue(currentIndex);
  const isActive = deferredCurrentIndex === index;

  const [slideWidth, setSlideWidth] = useState(0);

  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setSlideWidth(layout.width);
  }, []);

  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }

    const progress = scrollProgressSharedValue.value;
    const THRESHOLD = 0.6;
    const opacity = interpolate(
      progress,
      [index - THRESHOLD, index, index + THRESHOLD],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    const translateX = interpolate(
      progress,
      [index - THRESHOLD, index, index + THRESHOLD],
      Platform.OS === "android"
        ? // android needs to be more subtle to avoid the animation to appear laggy
          [-slideWidth * 0.05, 0, slideWidth * 0.05]
        : [-slideWidth * 0.2, 0, slideWidth * 0.2],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      progress,
      [index - THRESHOLD, index, index + THRESHOLD],
      [0.98, 1, 0.98],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        {
          translateX,
        },
        {
          scale,
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion]);

  const textAnimatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }

    const progress = scrollProgressSharedValue.value;
    const STAGGER_THRESHOLD = 0.5;

    const opacity = interpolate(
      progress,
      [index - 1 + STAGGER_THRESHOLD, index, index + 1 - STAGGER_THRESHOLD],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    const translateX = interpolate(
      progress,
      [index - STAGGER_THRESHOLD, index, index + STAGGER_THRESHOLD],
      [slideWidth * 0.05, 0, -slideWidth * 0.05],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        {
          translateX,
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
        <Box
          lx={{
            justifyContent: "center",
            minHeight: "s80", // the height of 2 lines of text
          }}
        >
          <Text
            typography="heading2SemiBold"
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
