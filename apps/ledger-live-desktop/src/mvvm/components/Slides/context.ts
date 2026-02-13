import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";

export interface SlidesContextValue {
  currentIndex: number;
  previousIndex: number;
  progress: MotionValue<number>;
  totalSlides: number;
  goToNext: () => void;
  goToPrevious: () => void;
  goToSlide: (index: number) => void;
}

export const SlidesContext = createContext<SlidesContextValue | null>(null);

export const useSlidesContext = () => {
  const context = useContext(SlidesContext);
  if (!context) {
    throw new Error("useSlidesContext must be used within a Slides component");
  }
  return context;
};
