import React from "react";
import { CardTransactionDetailView } from "./CardTransactionDetailView";
import { useCardTransactionDetailViewModel } from "./useCardTransactionDetailViewModel";
import type { CardTransactionDetailProps } from "./types";

export function CardTransactionDetail(props: CardTransactionDetailProps) {
  return <CardTransactionDetailView {...useCardTransactionDetailViewModel(props)} />;
}
