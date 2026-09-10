import { useDeferredValue } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { useSlideScrollAnimations } from "LLM/components/Slides";
import { useTranslation } from "~/context/Locale";
import { PRODUCT_TOUR_SLIDES } from "../const";

const CONTENT_TRANSLATE_RATIOS = { android: 0.2, ios: 0.2 };

export const useSlideItemViewModel = (index: number) => {
  const { t } = useTranslation();
  const { currentIndex } = useSlidesContext();
  const { animatedStyle, textAnimatedStyle, handleLayout } = useSlideScrollAnimations(
    index,
    CONTENT_TRANSLATE_RATIOS,
  );

  const deferredCurrentIndex = useDeferredValue(currentIndex);
  const isActive = deferredCurrentIndex === index;
  const shouldRender = Math.abs(deferredCurrentIndex - index) <= 1;

  const slide = PRODUCT_TOUR_SLIDES[index];
  // LottieView accepts an asset id (number) at runtime but its types don't.
  const lottieSrc = slide.lottieSrc;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const source = lottieSrc as unknown as string;
  const title = t(slide.titleKey);
  const subTitle = t(slide.subTitleKey);

  return {
    isActive,
    shouldRender,
    source,
    lottieSrc,
    title,
    subTitle,
    textAnimatedStyle,
    animatedStyle,
    handleLayout,
  };
};
