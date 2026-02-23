import { useCallback } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { track } from "~/analytics";

export const useSlideFooterButtonViewModel = (onClose: () => void) => {
  const { totalSlides, currentIndex, goToNext, scrollProgressSharedValue } = useSlidesContext();

  const lastIndex = totalSlides - 1;
  const isLastSlide = currentIndex >= lastIndex;

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

  return {
    lastIndex,
    isLastSlide,
    scrollProgressSharedValue,
    goNext,
    complete,
  };
};
