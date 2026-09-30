import React from "react";
import { CardVisualView } from "./CardVisualView";
import { useCardVisualViewModel } from "./useCardVisualViewModel";
import type { CardVisualProps } from "../../types";

type CardVisualInternalProps = CardVisualProps &
  Readonly<{
    fadeColor?: string;
  }>;

export function CardVisual({ fadeColor, ...props }: CardVisualInternalProps) {
  return <CardVisualView {...useCardVisualViewModel(props)} fadeColor={fadeColor} />;
}
