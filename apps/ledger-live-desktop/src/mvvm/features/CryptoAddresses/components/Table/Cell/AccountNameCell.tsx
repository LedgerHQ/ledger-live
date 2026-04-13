import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";

type AccountNameCellProps = {
  readonly account: AccountLike;
  readonly displayName: string;
};

export function AccountNameCell({ account, displayName }: AccountNameCellProps) {
  const currency = getAccountCurrency(account);
  return (
    <TableCellContent
      className="[&>*:first-child]:shrink-0"
      leadingContent={<CryptoCurrencyIcon currency={currency} size={32} />}
      title={displayName}
      description={currency.ticker}
    />
  );
}
