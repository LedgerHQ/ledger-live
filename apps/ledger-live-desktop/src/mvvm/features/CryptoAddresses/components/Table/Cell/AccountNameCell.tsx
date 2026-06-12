import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { SignedNameShield } from "./SignedNameShield";

type AccountNameCellProps = {
  readonly account: AccountLike;
  readonly displayName: string;
};

export function AccountNameCell({ account, displayName }: AccountNameCellProps) {
  const currency = getAccountCurrency(account);
  return (
    <TableCellContent
      leadingContent={<CryptoCurrencyIcon currency={currency} size={32} />}
      // Name + (when the name was signed with the Ledger device) the
      // shield-check badge, 8px apart per Figma 14414:20871.
      title={
        <span className="flex min-w-0 items-center gap-8">
          <span className="truncate">{displayName}</span>
          <SignedNameShield account={account} displayName={displayName} />
        </span>
      }
      description={currency.ticker}
    />
  );
}
