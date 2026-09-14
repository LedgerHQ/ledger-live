import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CardTransactionDetail } from "@features/flow-pay-card-transactions";
import type { TransactionSceneProps } from "./types";

export function TransactionScene({ transaction, formatters }: TransactionSceneProps) {
  return (
    <Box testID="card-details-transaction-content">
      <CardTransactionDetail transaction={transaction} formatters={formatters} />
    </Box>
  );
}
