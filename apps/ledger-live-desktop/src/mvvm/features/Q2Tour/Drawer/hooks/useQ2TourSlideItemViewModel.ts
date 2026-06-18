import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { themeSelector } from "~/renderer/actions/general";
import { Q2_TOUR_LAST_SLIDE_INDEX, Q2_TOUR_SLIDES } from "../const";
import { SLIDE_IMAGES } from "../assets";

interface UseQ2TourSlideItemViewModelProps {
  readonly slideIndex: number;
}

export interface Q2TourSlideItemViewModel {
  readonly title: string;
  readonly description: string;
  readonly imageSrc: string;
}

export function useQ2TourSlideItemViewModel({
  slideIndex,
}: UseQ2TourSlideItemViewModelProps): Q2TourSlideItemViewModel {
  const { t } = useTranslation();
  const theme = useSelector(themeSelector);

  return useMemo(() => {
    const safeIndex = slideIndex >= 0 && slideIndex <= Q2_TOUR_LAST_SLIDE_INDEX ? slideIndex : 0;
    const slide = Q2_TOUR_SLIDES[safeIndex];
    const imageSrc = SLIDE_IMAGES[theme][safeIndex] ?? SLIDE_IMAGES[theme][0];

    return {
      title: t(slide.titleKey),
      description: t(slide.descriptionKey),
      imageSrc,
    };
  }, [slideIndex, t, theme]);
}
