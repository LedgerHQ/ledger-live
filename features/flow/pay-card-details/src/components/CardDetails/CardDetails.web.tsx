import React from "react";
import { CardActions } from "../CardActions/CardActions";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardFlip } from "../CardFlip/CardFlip";
import { CardVisual } from "../CardVisual/CardVisual";
import { Reward } from "../Reward/Reward";
import { useRevealViewModel } from "../Reveal/useRevealViewModel";
import type { CardDetailsProps } from "../../types";

export function CardDetails({ cardVisual, formatters }: CardDetailsProps) {
  const reveal = useRevealViewModel();

  return (
    <div className="flex flex-col gap-16">
      <CardFlip
        reveal={reveal}
        cardFace={cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      />
      <CardActions reveal={reveal} />
      <Reward formatters={formatters} />
    </div>
  );
}
