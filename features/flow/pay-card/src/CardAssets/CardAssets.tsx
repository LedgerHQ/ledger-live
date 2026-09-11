import React from "react";
import { CardAssetsView } from "./CardAssetsView";
import { useCardAssetsViewModel } from "./useCardAssetsViewModel";

export function CardAssets() {
  return <CardAssetsView {...useCardAssetsViewModel()} />;
}
