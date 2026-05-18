import React from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { PageIndicator } from "@ledgerhq/lumen-ui-rnative";

export function CarouselProgressIndicator() {
  const { currentIndex, totalSlides } = useSlidesContext();

  return <PageIndicator currentPage={currentIndex + 1} totalPages={totalSlides} />;
}
