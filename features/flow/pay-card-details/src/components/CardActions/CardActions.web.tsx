import React from "react";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";
import { Reveal } from "../CardNumbers/Tile/RevealTile";
import type { CardNumbersViewProps } from "../../types";

type RevealProps = Pick<CardNumbersViewProps, "status" | "isRevealed" | "onReveal" | "onHide">;

export function CardActions({
  cardNumbersViewModel,
}: {
  readonly cardNumbersViewModel: RevealProps;
}) {
  return (
    <div className="flex flex-row gap-8">
      <div className="min-w-0 flex-1">
        <Reveal {...cardNumbersViewModel} />
      </div>
      <div className="min-w-0 flex-1">
        <Freeze />
      </div>
      <div className="min-w-0 flex-1">
        <More />
      </div>
    </div>
  );
}
