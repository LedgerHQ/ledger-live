import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { CARD_TRANSACTIONS_PREVIEW_LIMIT } from "../constants";
import { List } from "./components/List";
import type { CardTransactionsScreenViewProps } from "./types";

export function CardTransactionsView({
  displayState,
  title,
  transactions,
  formatters,
  onTransactionPress,
  onShowMore,
}: CardTransactionsScreenViewProps) {
  if (displayState !== "ready") {
    return null;
  }

  const preview = onShowMore
    ? transactions.slice(0, CARD_TRANSACTIONS_PREVIEW_LIMIT)
    : transactions;
  const showMore = Boolean(onShowMore) && transactions.length > CARD_TRANSACTIONS_PREVIEW_LIMIT;

  return (
    <div className="flex flex-col gap-12" data-testid="card-transactions">
      <Subheader>
        <SubheaderRow
          onClick={showMore ? onShowMore : undefined}
          data-testid="card-transactions-subheader"
        >
          <SubheaderTitle>{title}</SubheaderTitle>
          {showMore ? <SubheaderShowMore /> : null}
        </SubheaderRow>
      </Subheader>
      <List
        transactions={preview}
        formatters={formatters}
        onTransactionPress={onTransactionPress}
      />
    </div>
  );
}
