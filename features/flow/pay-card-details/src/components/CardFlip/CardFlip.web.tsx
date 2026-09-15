import React, { type ReactNode } from "react";
import { CardFlipView } from "./CardFlipView";
import type { RevealViewModel } from "../../types";

type CardFlipWebProps = Readonly<{
  reveal: RevealViewModel | null;
  cardFace?: ReactNode;
}>;

export function CardFlip({ reveal, cardFace }: CardFlipWebProps) {
  return reveal ? <CardFlipView {...reveal} cardFace={cardFace} /> : <>{cardFace}</>;
}
