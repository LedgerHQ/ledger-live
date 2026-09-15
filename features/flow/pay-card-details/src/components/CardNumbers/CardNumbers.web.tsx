import React from "react";
import { CardActions } from "../CardActions/CardActions";
import { CardNumbersView } from "./CardNumbersView";
import { useCardNumbersViewModel } from "./useCardNumbersViewModel";
import type { CardNumbersProps } from "../../types";

export function CardNumbers({ unlock, cardFace }: CardNumbersProps) {
  const cardNumbersViewModel = useCardNumbersViewModel({ unlock });

  return (
    <div className="flex flex-col gap-16">
      <CardNumbersView {...cardNumbersViewModel} cardFace={cardFace} />
      <CardActions cardNumbersViewModel={cardNumbersViewModel} />
    </div>
  );
}
