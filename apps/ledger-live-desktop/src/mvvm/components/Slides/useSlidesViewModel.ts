import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";
import { Content } from "./components/Content";
import { SlidesContextValue } from "./context";
import { isValidReactElement } from "@ledgerhq/react-ui";

const PROGRESS_ANIMATION_DURATION_S = 0.5;

type UseSlidesViewModelParams = {
  children: ReactNode;
  onSlideChange?: (index: number) => void;
  initialSlideIndex?: number;
};

type UseSlidesViewModelReturn = {
  contextValue: SlidesContextValue;
};

export function useSlidesViewModel({
  children,
  onSlideChange,
  initialSlideIndex = 0,
}: UseSlidesViewModelParams): UseSlidesViewModelReturn {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [previousIndex, setPreviousIndex] = useState(initialSlideIndex);
  const currentIndexRef = useRef(initialSlideIndex);
  const progress = useMotionValue(initialSlideIndex);

  useEffect(() => {
    setPreviousIndex(currentIndexRef.current);
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === previousIndex) {
      progress.set(currentIndex);
      return;
    }
    const controls = animate(progress, currentIndex, {
      duration: PROGRESS_ANIMATION_DURATION_S,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [currentIndex, previousIndex, progress]);

  const contentChild = React.Children.toArray(children).find(
    (child): child is React.ReactElement<{ children: ReactNode }> =>
      isValidReactElement(child) && child.type === Content,
  );

  const totalSlides = contentChild ? React.Children.toArray(contentChild.props.children).length : 0;

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
      previousIndex,
      progress,
      totalSlides,
      goToNext,
      goToPrevious,
      goToSlide,
    }),
    [currentIndex, previousIndex, totalSlides, goToNext, goToPrevious, goToSlide, progress],
  );

  return { contextValue };
}
