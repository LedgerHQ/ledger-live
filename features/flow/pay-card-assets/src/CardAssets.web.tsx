import React from "react";
import { CardAssetsView } from "./CardAssetsView";
import { useCardAssetsViewModel } from "./useCardAssetsViewModel";
import type { CardAssetsProps } from "./types";

export function CardAssets(props: CardAssetsProps) {
  return <CardAssetsView {...useCardAssetsViewModel(props)} />;
}
