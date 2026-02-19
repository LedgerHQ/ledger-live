import React from "react";
import { StyleSheet } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";

/** Threshold: below = Continue visible/touchable, above = Explore. Using display:none keeps touch in sync with opacity. */
const TOUCH_THRESHOLD_OFFSET = 0.25;

interface SlideFooterButtonProps {
  readonly onClose: () => void;
}

export const SlideFooterButton = ({ onClose }: SlideFooterButtonProps) => {
  const { totalSlides, goToNext, scrollProgressSharedValue } = useSlidesContext();
  const { t } = useTranslation();

  const lastIndex = totalSlides - 1;
  const fadeStart = lastIndex - 0.5;
  const touchThreshold = lastIndex - TOUCH_THRESHOLD_OFFSET;

  const continueStyle = useAnimatedStyle(() => {
    const progress = scrollProgressSharedValue.value;
    return {
      opacity: interpolate(progress, [fadeStart, lastIndex], [1, 0], "clamp"),
      display: progress >= touchThreshold ? ("none" as const) : ("flex" as const),
    };
  }, [fadeStart, lastIndex, touchThreshold, scrollProgressSharedValue]);

  const exploreStyle = useAnimatedStyle(() => {
    const progress = scrollProgressSharedValue.value;
    return {
      opacity: interpolate(progress, [fadeStart, lastIndex], [0, 1], "clamp"),
      display: progress < touchThreshold ? ("none" as const) : ("flex" as const),
    };
  }, [fadeStart, lastIndex, touchThreshold, scrollProgressSharedValue]);

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={[styles.button, continueStyle]}>
        <Button appearance="base" size="md" onPress={goToNext}>
          {t("walletV4Tour.cta.continue")}
        </Button>
      </Animated.View>

      <Animated.View style={[styles.button, exploreStyle]}>
        <Button appearance="base" size="md" onPress={onClose}>
          {t("walletV4Tour.cta.explore")}
        </Button>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  button: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
