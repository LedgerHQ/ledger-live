import React, { useState } from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { PageIndicator } from "@ledgerhq/lumen-ui-rnative";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export const ProgressIndicator = () => {
  const { currentIndex, totalSlides, scrollProgressSharedValue } = useSlidesContext();

  const [currentPage, setCurrentPage] = useState(currentIndex + 1);

  const prevPage = useSharedValue(currentIndex + 1);

  useAnimatedReaction(
    () => scrollProgressSharedValue.value,
    value => {
      // This is so that currentPage state is updated when the user scrolls about halfway through the next page
      const THRESHOLD = 0.95;
      const nextPage = Math.round(value + THRESHOLD);

      const clampedNextPage = Math.min(Math.max(nextPage, 1), totalSlides);

      if (nextPage !== prevPage.value) {
        prevPage.value = nextPage;
        scheduleOnRN(setCurrentPage, clampedNextPage);
      }
    },
    [scrollProgressSharedValue],
  );

  return <PageIndicator currentPage={currentPage} totalPages={totalSlides} />;
};
