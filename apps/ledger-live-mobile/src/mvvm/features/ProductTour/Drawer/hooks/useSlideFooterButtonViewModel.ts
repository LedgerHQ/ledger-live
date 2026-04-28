import { useCallback } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { track } from "~/analytics";
import { PAGE_TRACKING_PRODUCT_TOUR } from "../const";

export const useSlideFooterButtonViewModel = (closeDrawer: () => void) => {
  const { totalSlides, currentIndex, goToNext, scrollProgressSharedValue } = useSlidesContext();

  const lastIndex = totalSlides - 1;
  const isLastSlide = currentIndex >= lastIndex;

  const handleContinue = useCallback(() => {
    if (currentIndex === totalSlides - 1) {
      closeDrawer();
    } else {
      goToNext();
    }

    track("button_clicked", {
      button: "Continue",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndex + 1,
    });
  }, [currentIndex, goToNext, closeDrawer, totalSlides]);

  const handleCTA = useCallback(() => {
    track("button_clicked", {
      button: "CTA click",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndex + 1,
    });
  }, [currentIndex]);

  return {
    lastIndex,
    isLastSlide,
    scrollProgressSharedValue,
    handleCTA,
    handleContinue,
  };
};
