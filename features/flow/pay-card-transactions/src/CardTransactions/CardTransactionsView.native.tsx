import React from "react";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
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
    <Box lx={listContainerStyle} testID="card-transactions">
      <Subheader>
        <SubheaderRow
          onPress={showMore ? onShowMore : undefined}
          testID="card-transactions-subheader"
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
    </Box>
  );
}

const listContainerStyle: LumenViewStyle = {
  gap: "s12",
};
