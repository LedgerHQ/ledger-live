import React from "react";
import { CardArtwork } from "@features/flow-pay-card-details";
import { CardTransactionHistory } from "@features/flow-pay-card-transactions";
import type { CardTransactionHistoryProps } from "@features/flow-pay-card-transactions";
import type { CardHistoryViewModel } from "./types";

export function CardHistory({
  asset,
  formatters,
  formatDay,
  onTrackEvent,
  onGoToPay,
}: CardHistoryViewModel & Pick<CardTransactionHistoryProps, "asset">) {
  return (
    <CardTransactionHistory
      asset={asset}
      formatters={formatters}
      formatDay={formatDay}
      onTrackEvent={onTrackEvent}
      onGoToPay={onGoToPay}
      cardVisual={<CardArtwork />}
    />
  );
}
