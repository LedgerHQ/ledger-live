import type { ReactNode } from "react";
import type { CardTransactionFormatters, CardTransactionItem } from "../types";
import type { CardTransactionHistoryUiState } from "./cardTransactionHistoryUiState";

export type CardTransactionHistoryProps = Readonly<{
  formatters?: CardTransactionFormatters;
  /** Ledger currency id of the card asset to scope the history to, e.g. `bitcoin`. */
  asset?: string;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
  formatDay?: (date: Date) => string;
  onGoToPay?: () => void;
  cardVisual?: ReactNode;
}>;

export type CardTransactionHistoryViewProps = Readonly<{
  displayState: CardTransactionHistoryUiState;
  formatters?: CardTransactionFormatters;
  formatDay?: (date: Date) => string;
  onRowClick: (item: CardTransactionItem) => void;
  onGoToPay?: () => void;
  cardVisual?: ReactNode;
}>;
