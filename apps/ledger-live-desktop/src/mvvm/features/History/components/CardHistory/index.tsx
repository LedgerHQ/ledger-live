import React from "react";
import { CardArtwork } from "@features/flow-pay-card-details";
import { CardTransactionHistory } from "@features/flow-pay-card-transactions";
import type { CardHistoryViewModel } from "./types";

export function CardHistory({
  formatters,
  formatDay,
  onTrackEvent,
  onGoToPay,
  filterTransaction,
}: CardHistoryViewModel) {
  return (
    <CardTransactionHistory
      formatters={formatters}
      formatDay={formatDay}
      onTrackEvent={onTrackEvent}
      onGoToPay={onGoToPay}
      filterTransaction={filterTransaction}
      cardVisual={<CardArtwork />}
    />
  );
}
