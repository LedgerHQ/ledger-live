import React from "react";
import { CardAssetsView } from "./CardAssetsView";
import type { CardAssetsProps } from "./types";
import { useCardAssetsViewModel } from "./useCardAssetsViewModel";

export function CardAssets({ formatCountervalue, resolveCounterValue }: CardAssetsProps = {}) {
  return (
    <CardAssetsView {...useCardAssetsViewModel({ formatCountervalue, resolveCounterValue })} />
  );
}
