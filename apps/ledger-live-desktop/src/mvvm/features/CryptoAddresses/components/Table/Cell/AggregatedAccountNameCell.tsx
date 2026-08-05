import React from "react";
import { TableCellItem, TableCellContent, TableCellContentTitle } from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";

type AggregatedAccountNameCellProps = {
  readonly account: Account;
  readonly displayName: string;
};

export function AggregatedAccountNameCell({
  account,
  displayName,
}: AggregatedAccountNameCellProps) {
  return (
    <TableCellItem>
      <SquaredCryptoIcon
        ledgerId={account.currency.id}
        ticker={account.currency.ticker}
        size={32}
      />
      <TableCellContent>
        <TableCellContentTitle>{displayName}</TableCellContentTitle>
      </TableCellContent>
    </TableCellItem>
  );
}
