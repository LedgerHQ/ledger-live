import React from "react";
import { PayTrackPage } from "@features/platform-pay-analytics";
import { CardActions } from "../CardActions/CardActions";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardFlip } from "../CardFlip/CardFlip";
import { CardVisual } from "../CardVisual/CardVisual";
import { Reward } from "../Reward/Reward";
import { useRevealViewModel } from "../Reveal/useRevealViewModel";
import type { CardDetailsProps } from "../../types";

export function CardDetails({ cardVisual, formatters, cardSettingsActions }: CardDetailsProps) {
  const reveal = useRevealViewModel();

  return (
    <div className="flex flex-col gap-16">
      <PayTrackPage page="Card details" />
      {reveal.isRevealed ? <PayTrackPage page="Card digits" /> : null}
      <CardFlip
        reveal={reveal}
        cardFace={cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      />
      <CardActions reveal={reveal} cardSettingsActions={cardSettingsActions} />
      <Reward formatters={formatters} />
    </div>
  );
}
