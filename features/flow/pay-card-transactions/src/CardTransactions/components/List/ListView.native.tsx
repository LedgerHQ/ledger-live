import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ListItem } from "../ListItem";
import type { ListProps } from "./types";

export function ListView({ transactions, formatAmount }: ListProps) {
  return (
    <Box testID="card-transactions-list">
      {transactions.map(item => (
        <ListItem key={item.transaction.id} item={item} formatAmount={formatAmount} />
      ))}
    </Box>
  );
}
