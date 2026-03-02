import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { isValidReactElement } from "@ledgerhq/react-ui";
import { Content } from "./components/Content";
import { SlidesContextValue } from "./context";

type UseSlidesViewModelParams = {
  children: ReactNode;
  onSlideChange?: (index: number) => void;
  initialSlideIndex?: number;
};

type UseSlidesViewModelReturn = SlidesContextValue;

export function useSlidesViewModel({
  children,
  onSlideChange,
  initialSlideIndex = 0,
}: UseSlidesViewModelParams): UseSlidesViewModelReturn {
  const contentChild = React.Children.toArray(children).find(
    (child): child is React.ReactElement<{ children: ReactNode }> =>
      isValidReactElement(child) && child.type === Content,
  );

  const totalSlides = contentChild ? React.Children.toArray(contentChild.props.children).length : 0;
  const clampedInitialIndex =
    totalSlides > 0 ? Math.min(Math.max(0, initialSlideIndex), totalSlides - 1) : 0;

  const [currentIndex, setCurrentIndex] = useState(clampedInitialIndex);

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;
      if (index !== currentIndex) {
        setCurrentIndex(index);
        onSlideChange?.(index);
      }
    },
    [totalSlides, currentIndex, onSlideChange],
  );

  const goToNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, totalSlides, goToSlide]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide]);

  const contextValue = useMemo(
    () => ({
      currentIndex,
      totalSlides,
      initialIndex: clampedInitialIndex,
      goToNext,
      goToPrevious,
      goToSlide,
    }),
    [currentIndex, totalSlides, clampedInitialIndex, goToNext, goToPrevious, goToSlide],
  );

  return contextValue;
}
