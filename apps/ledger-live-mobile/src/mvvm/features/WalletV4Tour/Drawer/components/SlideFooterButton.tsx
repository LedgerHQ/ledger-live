import React from "react";
import { StyleSheet } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";

interface SlideFooterButtonProps {
  readonly onClose: () => void;
}

export const SlideFooterButton = ({ onClose }: SlideFooterButtonProps) => {
  const { totalSlides, goToNext, scrollProgressSharedValue } = useSlidesContext();
  const { t } = useTranslation();

  const lastIndex = totalSlides - 1;
  const fadeStart = lastIndex - 0.5;

  const continueStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        scrollProgressSharedValue.value,
        [fadeStart, lastIndex],
        [1, 0],
        "clamp",
      ),
    }),
    [fadeStart, lastIndex, scrollProgressSharedValue.value],
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
    [fadeStart, lastIndex, scrollProgressSharedValue.value],
  );

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={[styles.button, continueStyle]} pointerEvents="box-none">
        <Button appearance="base" size="md" onPress={goToNext}>
          {t("walletV4Tour.cta.continue")}
        </Button>
      </Animated.View>

      <Animated.View style={[styles.button, exploreStyle]} pointerEvents="box-none">
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
