import React, { useCallback } from "react";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { track } from "~/analytics";

interface SlideFooterButtonProps {
  readonly onClose: () => void;
}

export const SlideFooterButton = ({ onClose }: SlideFooterButtonProps) => {
  const { totalSlides, currentIndex, goToNext, scrollProgressSharedValue } = useSlidesContext();

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

  const lastIndex = totalSlides - 1;
  const fadeStart = lastIndex - 0.5;
  const isLastSlide = currentIndex >= lastIndex;
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

  const goNext = useCallback(() => {
    goToNext();

    track("button_clicked", {
      button: "Next",
      page: "Product Tour WV4",
      card: currentIndex + 1,
    });
  }, [currentIndex, goToNext]);

  const complete = useCallback(() => {
    onClose();

    track("button_clicked", {
      button: "Discover my new portfolio",
      page: "Product Tour WV4",
    });
  }, [onClose]);

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
