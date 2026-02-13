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
      // PageIndicator has some delay when updating the UI.
      // With our fading animation it becomes more noticeable.
      // So we need to decrease the threshold to update the currentPage to match with the scroll progress.
      const THRESHOLD = 0.95;
      const nextPage = Math.round(value + THRESHOLD);

      const clampedNextPage = Math.min(Math.max(nextPage, 1), totalSlides);

      // Prevent unnecessary calls in the JS thread
      if (clampedNextPage !== prevPage.value) {
        prevPage.value = clampedNextPage;
        scheduleOnRN(setCurrentPage, clampedNextPage);
      }
    },
    [scrollProgressSharedValue],
  );

  return <PageIndicator currentPage={currentPage} totalPages={totalSlides} />;
};
