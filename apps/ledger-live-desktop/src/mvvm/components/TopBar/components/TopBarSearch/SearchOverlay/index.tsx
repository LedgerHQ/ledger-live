import React from "react";
import { SearchOverlayView } from "./SearchOverlayView";
import { useSearchOverlayViewModel } from "./useSearchOverlayViewModel";

export function SearchOverlay() {
  const props = useSearchOverlayViewModel();
  return <SearchOverlayView {...props} />;
}
