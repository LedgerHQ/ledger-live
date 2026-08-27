import React from "react";
import { CardVisualView } from "./CardVisualView";
import type { CardVisualProps } from "../../types";

export function CardVisual(props: CardVisualProps) {
  return <CardVisualView {...props} />;
}
