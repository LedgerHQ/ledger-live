import React from "react";
import { CardActions } from "../CardActions/CardActions";
import { CardNumbersView } from "./CardNumbersView";
import { CardNumbersTile } from "./Tile/Tile";
import { useCardNumbersViewModel } from "./useCardNumbersViewModel";
import type { CardNumbersProps } from "../../types";

export function CardNumbers({ unlock, cardFace }: CardNumbersProps) {
  const numbers = useCardNumbersViewModel({ unlock });

  return (
    <>
      <CardNumbersView {...numbers} cardFace={cardFace} />
      <CardActions view={<CardNumbersTile {...numbers} />} />
    </>
  );
}
