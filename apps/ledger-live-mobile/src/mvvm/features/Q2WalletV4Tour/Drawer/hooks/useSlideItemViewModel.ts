import { useCallback, useState } from "react";
import { Platform, type LayoutChangeEvent } from "react-native";
import { useSlidesContext } from "@ledgerhq/native-ui";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { Q2_WALLET_V4_TOUR_SLIDES } from "../const";

export const useSlideItemViewModel = (index: number) => {
  const { scrollProgressSharedValue, currentIndex } = useSlidesContext();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const slide = Q2_WALLET_V4_TOUR_SLIDES[index];
  const title = t(slide.titleKey);
  const subtitle = slide.subTitleKey ? t(slide.subTitleKey) : "";
  const source = theme === "dark" ? slide.imageSrc.dark : slide.imageSrc.light;

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
        ? [-slideWidth * 0.05, 0, slideWidth * 0.05]
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
      transform: [{ translateX }, { scale }],
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
      transform: [{ translateX }],
    };
  }, [index, slideWidth, scrollProgressSharedValue, reduceMotion]);

  const shouldRender = Math.abs(currentIndex - index) <= 1;

  return {
    title,
    subtitle,
    source,
    shouldRender,
    animatedStyle,
    textAnimatedStyle,
    handleLayout,
  };
};
