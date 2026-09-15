import React, { type ReactNode } from "react";
import { useRevealViewModel } from "../Reveal/useRevealViewModel";
import { CardFlipView } from "./CardFlipView";
import type { UnlockForReveal } from "../../types";

type CardFlipProps = Readonly<{
  unlock?: UnlockForReveal;
  cardFace?: ReactNode;
}>;

export function CardFlip({ unlock, cardFace }: CardFlipProps) {
  const reveal = useRevealViewModel({ unlock });

  return reveal ? <CardFlipView {...reveal} cardFace={cardFace} /> : <>{cardFace}</>;
}
