import React from "react";
import { ExploreView } from "./ExploreView";
import { ProfileUpsellView } from "./ProfileUpsellView";
import { useExploreViewModel } from "./hooks/useExploreViewModel";

export function Explore() {
  const { title, handleClick, upsell } = useExploreViewModel();

  if (upsell) {
    return <ProfileUpsellView {...upsell} />;
  }

  return <ExploreView title={title} onClick={handleClick} />;
}
