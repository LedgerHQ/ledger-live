import React from "react";
import { CardActions } from "../CardActions/CardActions";
import { CardNumbersView } from "./CardNumbersView";
import { CardNumbersTile } from "./Tile/Tile";
import { useCardNumbersViewModel } from "./useCardNumbersViewModel";
import type { CardNumbersProps } from "../../types";

export function CardNumbers({ unlock, cardFace }: CardNumbersProps) {
  const numbers = useCardNumbersViewModel({ unlock });

  return (
    <div className="flex flex-col gap-16">
      <CardNumbersView {...numbers} cardFace={cardFace} />
      <CardActions>
        <CardNumbersTile {...numbers} />
      </CardActions>
    </div>
  );
}
