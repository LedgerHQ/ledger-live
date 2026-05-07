import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
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
    <TableCellContent
      leadingContent={
        <SquaredCryptoIcon
          ledgerId={account.currency.id}
          ticker={account.currency.ticker}
          size={32}
        />
      }
      title={displayName}
    />
  );
}
