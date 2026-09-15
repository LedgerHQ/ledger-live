import React from "react";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardVisual } from "../CardVisual/CardVisual";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";
import type { CardDetailsProps } from "../../types";

export function CardDetails({ cardVisual }: CardDetailsProps) {
  return (
    <div className="flex flex-col gap-16">
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      <div className="flex flex-row gap-8">
        <Freeze />
        <More />
      </div>
    </div>
  );
}
