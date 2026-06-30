import React from "react";
import { PageIndicator } from "@ledgerhq/lumen-ui-react";
import { useSlidesContext } from "LLD/components/Slides";

export function TourProgressIndicator() {
  const { displayedIndex, totalSlides } = useSlidesContext();

  return (
    <div className="flex justify-center py-24">
      <PageIndicator currentPage={displayedIndex + 1} totalPages={totalSlides} />
    </div>
  );
}
