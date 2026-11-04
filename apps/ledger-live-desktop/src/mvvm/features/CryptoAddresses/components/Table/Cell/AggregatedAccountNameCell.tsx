import React from "react";
import {
  TableCellItem,
  TableCellContent,
  TableCellContentTitle,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";

type AggregatedAccountNameCellProps = {
  readonly account: Account;
  readonly displayName: string;
  readonly tag?: string;
};

export function AggregatedAccountNameCell({
  account,
  displayName,
  tag,
}: AggregatedAccountNameCellProps) {
  return (
    <TableCellItem>
      <SquaredCryptoIcon
        ledgerId={account.currency.id}
        ticker={account.currency.ticker}
        size={32}
      />
      <TableCellContent>
        <div className="flex min-w-0 items-center gap-8">
          <TableCellContentTitle>{displayName}</TableCellContentTitle>
          {tag ? <Tag label={tag} size="sm" appearance="gray" /> : null}
        </div>
      </TableCellContent>
    </TableCellItem>
  );
}
