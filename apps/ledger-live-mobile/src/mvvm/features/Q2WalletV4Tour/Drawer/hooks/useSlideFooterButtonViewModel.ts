import { useCallback } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { PAGE_TRACKING_Q2_WALLET_V4_TOUR } from "../const";

export const useSlideFooterButtonViewModel = (onComplete: () => void) => {
  const { t } = useTranslation();
  const { totalSlides, currentIndex, goToNext, scrollProgressSharedValue } = useSlidesContext();

  const lastIndex = totalSlides - 1;
  const isFirstSlide = currentIndex <= 0;
  const isLastSlide = currentIndex >= lastIndex;
  const fadeStart = lastIndex - 0.5;
  const isInTest = process.env.NODE_ENV === "test";

  const primaryLabel = isFirstSlide ? t("q2WalletV4Tour.cta.start") : t("q2WalletV4Tour.cta.next");
  const doneLabel = t("q2WalletV4Tour.cta.done");

  const goNext = useCallback(() => {
    goToNext();
    track("button_clicked", {
      button: "Next",
      page: PAGE_TRACKING_Q2_WALLET_V4_TOUR,
      card: currentIndex + 1,
    });
  }, [currentIndex, goToNext]);

  const complete = useCallback(() => {
    onComplete();
    track("button_clicked", {
      button: "Got it",
      page: PAGE_TRACKING_Q2_WALLET_V4_TOUR,
    });
  }, [onComplete]);

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

  const doneStyle = useAnimatedStyle(
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

  return {
    primaryLabel,
    doneLabel,
    continueStyle,
    doneStyle,
    isLastSlide,
    isDoneButtonInteractive: isLastSlide || isInTest,
    goNext,
    complete,
  };
};
