import React, { createContext, useContext } from "react";
import { FlatList } from "react-native";
import { useSharedValue } from "react-native-reanimated";

export const SlidesContext = createContext<{
  currentIndex: number;
  totalSlides: number;
  goToNext: () => void;
  goToPrevious: () => void;
  goToSlide: (index: number) => void;
  flatListRef: React.RefObject<FlatList<React.ReactElement> | null>;
  scrollProgressSharedValue: ReturnType<typeof useSharedValue<number>>;
} | null>(null);

export const useSlidesContext = () => {
  const context = useContext(SlidesContext);
  if (!context) {
    throw new Error("useSlidesContext must be used within a Slides component");
  }
  return context;
};
