import { useSlidesContext } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useSlideScrollAnimations } from "LLM/components/Slides";
import { useTranslation } from "~/context/Locale";
import type { WalletV4TourSlide } from "../types";

export const useSlideItemViewModel = (index: number, slide: WalletV4TourSlide) => {
  const { currentIndex } = useSlidesContext();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { animatedStyle, textAnimatedStyle, handleLayout } = useSlideScrollAnimations(index);

  const title = t(slide.titleKey);
  const subtitle = slide.subTitleKey ? t(slide.subTitleKey) : "";
  const source = theme === "dark" ? slide.imageSrc.dark : slide.imageSrc.light;

  const shouldRender = Math.abs(currentIndex - index) <= 1;

  return {
    title,
    subtitle,
    source,
    shouldRender,
    animatedStyle,
    textAnimatedStyle,
    handleLayout,
  };
};
