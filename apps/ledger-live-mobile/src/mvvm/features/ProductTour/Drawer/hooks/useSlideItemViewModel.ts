import { useCallback, useDeferredValue, useState } from "react";
import { type LayoutChangeEvent } from "react-native";
import { useSlidesContext } from "@ledgerhq/native-ui";
import animation01 from "../animations/01.lottie";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";

export const useSlideItemViewModel = (index: number) => {
  const { currentIndex, scrollProgressSharedValue } = useSlidesContext();

  const deferredCurrentIndex = useDeferredValue(currentIndex);
  const isActive = deferredCurrentIndex === index;
  const shouldRender = Math.abs(deferredCurrentIndex - index) <= 1;

  const source = animation01 as unknown as string;

  const [slideWidth, setSlideWidth] = useState(0);

  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setSlideWidth(layout.width);
  }, []);

  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};

    const progress = scrollProgressSharedValue.value;
    const THRESHOLD = 0.6;

    const underThreshold = index - THRESHOLD;
    const overThreshold = index + THRESHOLD;

    return {
      opacity: interpolate(
        progress,
        [underThreshold, index, overThreshold],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            [underThreshold, index, overThreshold],
            [-slideWidth * 0.2, 0, slideWidth * 0.2],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            progress,
            [underThreshold, index, overThreshold],
            [0.98, 1, 0.98],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion]);

  const textAnimatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};

    const progress = scrollProgressSharedValue.value;
    const STAGGER_THRESHOLD = 0.5;
    const underThreshold = index - 1;
    const overThreshold = index + 1;

    return {
      opacity: interpolate(
        progress,
        [underThreshold + STAGGER_THRESHOLD, index, overThreshold - STAGGER_THRESHOLD],
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

  return {
    isActive,
    shouldRender,
    source,
    textAnimatedStyle,
    animatedStyle,
    handleLayout,
  };
};
