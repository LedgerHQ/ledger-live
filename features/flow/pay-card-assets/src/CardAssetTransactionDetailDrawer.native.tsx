import React from "react";
import {
  CardTransactionDetail,
  type CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { CardAssetsViewModel } from "./types";

type CardAssetTransactionDetailDrawerProps = Readonly<{
  transaction: CardTransactionItem;
  formatters?: CardAssetsViewModel["formatters"];
}>;

export function CardAssetTransactionDetailDrawer({
  transaction,
  formatters,
}: CardAssetTransactionDetailDrawerProps) {
  return (
    <Box testID="card-asset-transaction-detail-drawer">
      <Box lx={{ paddingBottom: "s24" }}>
        <CardTransactionDetail transaction={transaction.transaction} formatters={formatters} />
      </Box>
    </Box>
  );
}
