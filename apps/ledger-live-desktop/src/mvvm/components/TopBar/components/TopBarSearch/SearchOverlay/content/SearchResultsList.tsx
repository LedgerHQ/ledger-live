import React from "react";
import { useSearchOverlay } from "../SearchOverlayContext";

export function SearchResultsList() {
  const { results } = useSearchOverlay();

  if (results.isLoading) {
    return <div className="flex flex-col gap-12" data-testid="search-results-skeleton" />;
  }

  return (
    <div className="flex flex-col gap-12" data-testid="search-results-list">
      {/* Result rows wired by the section tickets via `results.data`. */}
    </div>
  );
}
