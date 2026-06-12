import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { SignedNameShield } from "./SignedNameShield";

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
      // Name + (when the name was signed with the Ledger device) the
      // shield-check badge, 8px apart per Figma 14414:20871.
      title={
        <span className="flex min-w-0 items-center gap-8">
          <span className="truncate">{displayName}</span>
          <SignedNameShield account={account} displayName={displayName} />
        </span>
      }
    />
  );
}
