import React from "react";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardVisual } from "../CardVisual/CardVisual";
import { CardActions } from "../CardActions/CardActions.web";
import type { CardDetailsProps } from "../../types";

/**
 * Web keeps the card face and the actions inline on the page, so `CardDetails` is a thin composition
 * of the visual and {@link CardActions}. The native side, by contrast, moves the actions into a
 * Details bottom sheet.
 */
export function CardDetails({ cardVisual }: CardDetailsProps) {
  return (
    <div className="flex flex-col gap-16">
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}
      <CardActions />
    </div>
  );
}
