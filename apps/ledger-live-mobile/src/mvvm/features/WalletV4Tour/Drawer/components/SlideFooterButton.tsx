import React from "react";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSlideFooterButtonViewModel } from "../hooks/useSlideFooterButtonViewModel";

interface SlideFooterButtonProps {
  readonly onClose: () => void;
}

export const SlideFooterButton = ({ onClose }: SlideFooterButtonProps) => {
  const { lastIndex, isLastSlide, scrollProgressSharedValue, goNext, complete } =
    useSlideFooterButtonViewModel(onClose);

  const styles = useStyleSheet(
    () => ({
      container: {
        position: "relative",
      },
      button: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
      },
    }),
    [],
  );
  const { t } = useTranslation();

  const fadeStart = lastIndex - 0.5;
  const isInTest = process.env.NODE_ENV === "test";

  const continueStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        scrollProgressSharedValue.value,
        [fadeStart, lastIndex],
        [1, 0],
        "clamp",
      ),
    }),
    [fadeStart, lastIndex, scrollProgressSharedValue],
  );

  const exploreStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        scrollProgressSharedValue.value,
        [fadeStart, lastIndex],
        [0, 1],
        "clamp",
      ),
    }),
    [fadeStart, lastIndex, scrollProgressSharedValue],
  );

  return (
    <Animated.View style={styles.container}>
      <Animated.View
        style={[styles.button, continueStyle]}
        pointerEvents={isLastSlide ? "none" : "box-none"}
      >
        <Button appearance="base" size="lg" onPress={goNext}>
          {t("walletV4Tour.cta.continue")}
        </Button>
      </Animated.View>

      <Animated.View
        style={[styles.button, exploreStyle]}
        pointerEvents={isLastSlide || isInTest ? "box-none" : "none"}
      >
        <Button appearance="base" size="lg" onPress={complete}>
          {t("walletV4Tour.cta.explore")}
        </Button>
      </Animated.View>
    </Animated.View>
  );
};
