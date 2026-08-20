import React from "react";

import { useHardwareCarouselCloseAllLinkViewModel } from "./useHardwareCarouselCloseAllLinkViewModel";

type HardwareCarouselCloseAllLinkProps = Readonly<{
  cardIds: readonly string[];
}>;

export default HardwareCarouselCloseAllLink;

function HardwareCarouselCloseAllLink({ cardIds }: HardwareCarouselCloseAllLinkProps) {
  const { handleCloseAll, label } = useHardwareCarouselCloseAllLinkViewModel({ cardIds });

  return (
    <button
      className="shrink-0 flex cursor-pointer items-center border-0 bg-transparent p-0 body-2-semi-bold text-muted hover:text-muted-pressed"
      data-testid="hardware-carousel-close-all"
      onClick={handleCloseAll}
      type="button"
    >
      {label}
    </button>
  );
}
