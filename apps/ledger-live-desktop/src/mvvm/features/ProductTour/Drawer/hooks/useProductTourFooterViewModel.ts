import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSlidesContext } from "LLD/components/Slides";
import { track } from "~/renderer/analytics/segment";
import {
  PAGE_TRACKING_PRODUCT_TOUR,
  PRODUCT_TOUR_LAST_SLIDE_INDEX,
  PRODUCT_TOUR_SLIDES,
} from "../const";
import type { ProductTourPrimaryAction } from "../const";

interface ProductTourFooterViewModelProps {
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
  readonly onComplete: () => void;
}

export interface ProductTourFooterViewModel {
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly onPrimaryClick: () => void;
  readonly onSecondaryClick: () => void;
}

export function useProductTourFooterViewModel({
  onPrimaryAction,
  onComplete,
}: ProductTourFooterViewModelProps): ProductTourFooterViewModel {
  const { t } = useTranslation();
  const { currentIndex, totalSlides, goToNext } = useSlidesContext();
  const isLastSlide = currentIndex === totalSlides - 1;

  const currentSlide =
    PRODUCT_TOUR_SLIDES[currentIndex] ?? PRODUCT_TOUR_SLIDES[PRODUCT_TOUR_LAST_SLIDE_INDEX];

  return useMemo(
    () => ({
      primaryLabel: t(currentSlide.primaryLabelKey),
      secondaryLabel: isLastSlide ? t("productTour.cta.done") : t("productTour.cta.continue"),
      onPrimaryClick: () => {
        track("button_clicked", {
          button: "CTA click",
          page: PAGE_TRACKING_PRODUCT_TOUR,
          card: currentIndex + 1,
          action: currentSlide.primaryAction,
        });
        onPrimaryAction(currentSlide.primaryAction);
      },
      onSecondaryClick: () => {
        track("button_clicked", {
          button: isLastSlide ? "Done" : "Continue",
          page: PAGE_TRACKING_PRODUCT_TOUR,
          card: currentIndex + 1,
        });
        if (isLastSlide) {
          onComplete();
          return;
        }

        goToNext();
      },
    }),
    [currentIndex, currentSlide, goToNext, isLastSlide, onComplete, onPrimaryAction, t],
  );
}
