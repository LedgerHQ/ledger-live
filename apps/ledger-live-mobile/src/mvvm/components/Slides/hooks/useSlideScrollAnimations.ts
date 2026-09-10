import { useCallback, useState } from "react";
import { Platform, type LayoutChangeEvent } from "react-native";
import { useSlidesContext } from "@ledgerhq/native-ui";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";

type ContentTranslateRatios = {
  readonly android: number;
  readonly ios: number;
};

const DEFAULT_CONTENT_TRANSLATE_RATIOS: ContentTranslateRatios = {
  android: 0.05,
  ios: 0.2,
};

export function getContentTranslateRatio(
  platform: typeof Platform.OS,
  ratios: ContentTranslateRatios,
) {
  "worklet";
  return platform === "android" ? ratios.android : ratios.ios;
}

export function useSlideScrollAnimations(
  index: number,
  contentTranslateRatios = DEFAULT_CONTENT_TRANSLATE_RATIOS,
) {
  const { scrollProgressSharedValue } = useSlidesContext();
  const [slideWidth, setSlideWidth] = useState(0);
  const reduceMotion = useReducedMotion();

  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setSlideWidth(layout.width);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }

    const progress = scrollProgressSharedValue.value;
    const threshold = 0.6;
    const inputRange = [index - threshold, index, index + threshold];
    const translateRatio = getContentTranslateRatio(Platform.OS, contentTranslateRatios);

    return {
      opacity: interpolate(progress, inputRange, [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(
            progress,
            inputRange,
            [-slideWidth * translateRatio, 0, slideWidth * translateRatio],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(progress, inputRange, [0.98, 1, 0.98], Extrapolation.CLAMP),
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion, contentTranslateRatios]);

  const textAnimatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }

    const progress = scrollProgressSharedValue.value;
    const threshold = 0.5;

    return {
      opacity: interpolate(
        progress,
        [index - 1 + threshold, index, index + 1 - threshold],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            progress,
            [index - threshold, index, index + threshold],
            [slideWidth * 0.05, 0, -slideWidth * 0.05],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion]);

  return {
    animatedStyle,
    textAnimatedStyle,
    handleLayout,
  };
}
