import React from "react";
import { CardTransactionsView } from "./CardTransactionsView";
import { useCardTransactionsScreenViewModel } from "./useCardTransactionsScreenViewModel";
import type { CardTransactionsProps } from "./CardTransactions.types";

export function CardTransactions(props: CardTransactionsProps) {
  return <CardTransactionsView {...useCardTransactionsScreenViewModel(props)} />;
}
