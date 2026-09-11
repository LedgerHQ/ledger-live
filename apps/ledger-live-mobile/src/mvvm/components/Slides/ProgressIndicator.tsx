import React, { useState } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { PageIndicator } from "@ledgerhq/lumen-ui-rnative";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export function getPageFromScrollProgress(scrollProgress: number, totalSlides: number) {
  "worklet";
  return Math.min(Math.max(Math.round(scrollProgress + 0.95), 1), totalSlides);
}

export function ProgressIndicator() {
  const { currentIndex, totalSlides, scrollProgressSharedValue } = useSlidesContext();
  const [currentPage, setCurrentPage] = useState(currentIndex + 1);
  const previousPage = useSharedValue(currentIndex + 1);

  useAnimatedReaction(
    () => scrollProgressSharedValue.value,
    value => {
      const nextPage = getPageFromScrollProgress(value, totalSlides);

      if (nextPage !== previousPage.value) {
        previousPage.value = nextPage;
        scheduleOnRN(setCurrentPage, nextPage);
      }
    },
    [scrollProgressSharedValue],
  );

  return <PageIndicator currentPage={currentPage} totalPages={totalSlides} />;
}
