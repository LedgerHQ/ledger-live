import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { themeSelector } from "~/renderer/actions/general";
import type { ReleaseTourSlide } from "./types";

interface UseReleaseTourSlideItemViewModelProps {
  readonly slideIndex: number;
  readonly slides: readonly ReleaseTourSlide[];
}

export interface ReleaseTourSlideItemViewModel {
  readonly title: string;
  readonly description: string;
  readonly imageSrc: string;
}

export function useReleaseTourSlideItemViewModel({
  slideIndex,
  slides,
}: UseReleaseTourSlideItemViewModelProps): ReleaseTourSlideItemViewModel {
  const { t } = useTranslation();
  const theme = useSelector(themeSelector);

  return useMemo(() => {
    const safeIndex = slideIndex >= 0 && slideIndex < slides.length ? slideIndex : 0;
    const slide = slides[safeIndex];

    return {
      title: t(slide.titleKey),
      description: t(slide.descriptionKey),
      imageSrc: slide.imageSrc[theme],
    };
  }, [slideIndex, slides, t, theme]);
}
