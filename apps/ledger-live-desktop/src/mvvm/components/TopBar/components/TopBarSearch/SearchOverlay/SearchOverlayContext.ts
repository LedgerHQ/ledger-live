import { createContext, useContext } from "react";
import { SearchOverlayContextValue } from "./types";

const SearchOverlayContext = createContext<SearchOverlayContextValue | null>(null);

export function useSearchOverlay() {
  const ctx = useContext(SearchOverlayContext);
  if (!ctx) {
    throw new Error("useSearchOverlay must be used within a SearchOverlay");
  }
  return ctx;
}

export default SearchOverlayContext;
