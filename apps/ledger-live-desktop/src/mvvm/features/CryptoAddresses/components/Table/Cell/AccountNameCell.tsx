import React from "react";
import {
  TableCellItem,
  TableCellContent,
  TableCellContentTitle,
  TableCellContentDescription,
} from "@ledgerhq/lumen-ui-react";
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
    <TableCellItem>
      <CryptoCurrencyIcon currency={currency} size={32} />
      <TableCellContent>
        <TableCellContentTitle>{displayName}</TableCellContentTitle>
        <TableCellContentDescription>{currency.ticker}</TableCellContentDescription>
      </TableCellContent>
    </TableCellItem>
  );
}
