import { useCallback } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { withOptionalVariant } from "../analytics";
import type { WalletV4Tour } from "../types";

type UseSlideFooterButtonViewModelParams = Pick<WalletV4Tour, "copy" | "page" | "variant"> & {
  readonly onContinueClick?: (slideIndex: number, isLastSlide: boolean) => void;
};

export const useSlideFooterButtonViewModel = (
  onComplete: () => void,
  { copy, page, variant, onContinueClick }: UseSlideFooterButtonViewModelParams,
) => {
  const { t } = useTranslation();
  const { totalSlides, currentIndex, goToNext, scrollProgressSharedValue } = useSlidesContext();

  const lastIndex = totalSlides - 1;
  const isFirstSlide = currentIndex <= 0;
  const isLastSlide = currentIndex >= lastIndex;
  const fadeStart = lastIndex - 0.5;
  const isInTest = process.env.NODE_ENV === "test";

  const primaryLabel = isFirstSlide ? t(copy.startKey) : t(copy.nextKey);
  const doneLabel = t(copy.doneKey);

  const goNext = useCallback(() => {
    if (onContinueClick) {
      onContinueClick(currentIndex, false);
    } else {
      track(
        "button_clicked",
        withOptionalVariant(
          {
            button: "Next",
            page,
            card: currentIndex + 1,
          },
          variant,
        ),
      );
    }
    goToNext();
  }, [currentIndex, goToNext, onContinueClick, page, variant]);

  const complete = useCallback(() => {
    if (onContinueClick) {
      onContinueClick(currentIndex, true);
    } else {
      track(
        "button_clicked",
        withOptionalVariant(
          {
            button: "Got it",
            page,
          },
          variant,
        ),
      );
    }
    onComplete();
  }, [currentIndex, onComplete, onContinueClick, page, variant]);

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
