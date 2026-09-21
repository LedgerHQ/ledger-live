import React from "react";
import { CardVisualView } from "./CardVisualView";
import { useCardVisualViewModel } from "./useCardVisualViewModel";
import type { CardVisualProps } from "../../types";

export function CardVisual(props: CardVisualProps) {
  return <CardVisualView {...useCardVisualViewModel(props)} />;
}
