import { useCallback } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import {
  PAGE_TRACKING_PRODUCT_TOUR,
  PRODUCT_TOUR_SLIDES,
  PRODUCT_TOUR_LAST_SLIDE_INDEX,
} from "../const";
import type { ProductTourPrimaryAction } from "../const";

interface SlideFooterButtonViewModelProps {
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
}

export const useSlideFooterButtonViewModel = ({
  onPrimaryAction,
}: SlideFooterButtonViewModelProps) => {
  const { t } = useTranslation();
  const { totalSlides, currentIndex, goToNext, goToSlide, scrollProgressSharedValue } =
    useSlidesContext();

  const lastIndex = totalSlides - 1;
  const isLastSlide = currentIndex >= lastIndex;

  const currentSlide =
    PRODUCT_TOUR_SLIDES[currentIndex] ?? PRODUCT_TOUR_SLIDES[PRODUCT_TOUR_LAST_SLIDE_INDEX];

  const primaryLabel = t(currentSlide.primaryLabelKey);
  const secondaryLabel = isLastSlide ? t("productTour.done.cta") : t("common.continue");

  const handleContinue = useCallback(() => {
    if (isLastSlide) {
      goToSlide(0);
    } else {
      goToNext();
    }

    track("button_clicked", {
      button: isLastSlide ? "Start again" : "Continue",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndex + 1,
    });
  }, [isLastSlide, currentIndex, goToNext, goToSlide]);

  const handleCTA = useCallback(() => {
    onPrimaryAction(currentSlide.primaryAction);

    track("button_clicked", {
      button: "CTA click",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndex + 1,
      action: currentSlide.primaryAction,
    });
  }, [currentIndex, currentSlide, onPrimaryAction]);

  return {
    lastIndex,
    isLastSlide,
    scrollProgressSharedValue,
    primaryLabel,
    secondaryLabel,
    handleCTA,
    handleContinue,
  };
};
