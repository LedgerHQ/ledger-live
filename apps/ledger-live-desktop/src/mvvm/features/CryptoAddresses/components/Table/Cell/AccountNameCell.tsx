import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import type { AccountLike } from "@ledgerhq/types-live";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { getAccountCurrency } from "~/renderer/lib/getDomainCurrencyForAccount";

type AccountNameCellProps = {
  readonly account: AccountLike;
  readonly displayName: string;
};

export function AccountNameCell({ account, displayName }: AccountNameCellProps) {
  const currency = getAccountCurrency(account);
  return (
    <TableCellContent
      leadingContent={<CryptoCurrencyIcon currency={currency} size={32} />}
      title={displayName}
      description={currency.ticker}
    />
  );
}
