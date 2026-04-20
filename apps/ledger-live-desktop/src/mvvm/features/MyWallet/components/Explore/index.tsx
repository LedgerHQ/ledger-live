import React from "react";
import { ExploreView } from "./ExploreView";
import { useExploreViewModel } from "./hooks/useExploreViewModel";

export function Explore() {
  const { title, handleClick } = useExploreViewModel();

  return <ExploreView title={title} onClick={handleClick} />;
}
