import React from "react";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";
import { Reveal } from "../CardNumbers/Tile/Tile";
import type { CardNumbersViewProps } from "../../types";

type RevealProps = Pick<CardNumbersViewProps, "status" | "imageUrl" | "onReveal" | "onHide">;

export function CardActions({
  cardNumbersViewModel,
}: {
  readonly cardNumbersViewModel?: RevealProps;
}) {
  return (
    <div className="flex flex-row gap-8">
      {cardNumbersViewModel ? <Reveal {...cardNumbersViewModel} /> : null}
      <Freeze />
      <More />
    </div>
  );
}
