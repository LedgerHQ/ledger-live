import React from "react";
import { CardView } from "./CardView";
import type { CardProps } from "./Card.types";
import { useCardViewModel } from "./useCardViewModel";

export function Card(props: CardProps) {
  return <CardView {...useCardViewModel(props)} />;
}
