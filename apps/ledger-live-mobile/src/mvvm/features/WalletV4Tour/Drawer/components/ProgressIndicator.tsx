import React from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { PageIndicator } from "@ledgerhq/lumen-ui-rnative";

export const ProgressIndicator = () => {
  const { currentIndex, totalSlides } = useSlidesContext();

  return <PageIndicator currentPage={currentIndex} totalPages={totalSlides} />;
};
