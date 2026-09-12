import React from "react";
import { CardNumbersView } from "./CardNumbersView";
import { useCardNumbersViewModel } from "./useCardNumbersViewModel";
import type { CardNumbersProps } from "../../types";

export function CardNumbers({ unlock, cardFace }: CardNumbersProps) {
  return <CardNumbersView {...useCardNumbersViewModel({ unlock })} cardFace={cardFace} />;
}
