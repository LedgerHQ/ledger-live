import React, { ReactNode, RefObject, useCallback, useMemo, useRef, useState } from "react";
import { isValidReactElement } from "@ledgerhq/react-ui";
import { Content } from "./components/Content";
import { SlidesContextValue } from "./context";

type UseSlidesViewModelParams = {
  children: ReactNode;
  onSlideChange?: (index: number) => void;
  initialSlideIndex?: number;
};

type UseSlidesViewModelReturn = {
  scrollContainerRef: RefObject<HTMLDivElement>;
  handleScroll: () => void;
  contextValue: SlidesContextValue;
  totalSlides: number;
};

export function useSlidesViewModel({
  children,
  onSlideChange,
  initialSlideIndex = 0,
}: UseSlidesViewModelParams): UseSlidesViewModelReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null!);
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);

  const contentChild = React.Children.toArray(children).find(
    (child): child is React.ReactElement<{ children: ReactNode }> =>
      isValidReactElement(child) && child.type === Content,
  );

  const totalSlides = contentChild ? React.Children.toArray(contentChild.props.children).length : 0;

  const goToSlide = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (!container || index < 0 || index >= totalSlides) return;
      const slideWidth = container.offsetWidth;
      container.scrollTo({ left: index * slideWidth, behavior: "smooth" });
    },
    [totalSlides],
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

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const slideWidth = container.offsetWidth;
    if (slideWidth <= 0) return;

    const newIndex = Math.round(container.scrollLeft / slideWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < totalSlides) {
      setCurrentIndex(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentIndex, totalSlides, onSlideChange]);

  const contextValue = useMemo(
    () => ({ currentIndex, totalSlides, goToNext, goToPrevious, goToSlide }),
    [currentIndex, totalSlides, goToNext, goToPrevious, goToSlide],
  );

  return { scrollContainerRef, handleScroll, contextValue, totalSlides };
}
