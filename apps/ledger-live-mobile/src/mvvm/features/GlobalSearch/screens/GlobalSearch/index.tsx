import React from "react";
import { GlobalSearchView } from "./GlobalSearchView";
import { useGlobalSearchViewModel } from "./useGlobalSearchViewModel";

export function GlobalSearch() {
  return <GlobalSearchView {...useGlobalSearchViewModel()} />;
}
