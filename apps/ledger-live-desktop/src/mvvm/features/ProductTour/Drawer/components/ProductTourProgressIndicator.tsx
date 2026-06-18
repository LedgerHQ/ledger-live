import React from "react";
import { PageIndicator } from "@ledgerhq/lumen-ui-react";
import { useSlidesContext } from "LLD/components/Slides";

export function ProductTourProgressIndicator() {
  const { displayedIndex, totalSlides } = useSlidesContext();

  return (
    <div className="mb-20 flex justify-center">
      <PageIndicator currentPage={displayedIndex + 1} totalPages={totalSlides} />
    </div>
  );
}
