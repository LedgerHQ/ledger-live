import React from "react";
import { CardNumbersView } from "./CardNumbersView";
import { CardNumbersTile } from "./Tile/Tile";
import { useCardNumbersViewModel } from "./useCardNumbersViewModel";
import type { CardNumbersProps } from "../../types";

export function CardNumbers({ unlock, cardFace }: CardNumbersProps) {
  const numbers = useCardNumbersViewModel({ unlock });

  return (
    <>
      <CardNumbersView {...numbers} cardFace={cardFace} />
      <CardNumbersTile {...numbers} />
    </>
  );
}
