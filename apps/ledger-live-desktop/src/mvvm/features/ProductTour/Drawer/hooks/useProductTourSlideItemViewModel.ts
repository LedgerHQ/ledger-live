import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getEnv } from "@ledgerhq/live-env";

import { PRODUCT_TOUR_LAST_SLIDE_INDEX, PRODUCT_TOUR_SLIDES } from "../const";
import { SLIDE_LOTTIES } from "../lotties";

interface ProductTourSlideItemViewModelProps {
  readonly slideIndex: number;
}

export interface ProductTourSlideItemViewModel {
  readonly title: string;
  readonly subtitle: string;
  readonly lottieSrc: string;
  readonly shouldAutoplay: boolean;
}

export function useProductTourSlideItemViewModel({
  slideIndex,
}: ProductTourSlideItemViewModelProps): ProductTourSlideItemViewModel {
  const { t } = useTranslation();
  const shouldAutoplay = !getEnv("PLAYWRIGHT_RUN");

  return useMemo(() => {
    const safeIndex =
      slideIndex >= 0 && slideIndex <= PRODUCT_TOUR_LAST_SLIDE_INDEX ? slideIndex : 0;
    const slide = PRODUCT_TOUR_SLIDES[safeIndex];

    return {
      title: t(slide.titleKey),
      subtitle: t(slide.subTitleKey),
      lottieSrc: SLIDE_LOTTIES[safeIndex],
      shouldAutoplay,
    };
  }, [slideIndex, t, shouldAutoplay]);
}
