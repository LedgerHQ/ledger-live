import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { CounterValueCell } from "LLD/features/Assets/components/Cells/CounterValueCell";

export function AccountValueCell({ account }: { readonly account: AccountLike }) {
  const currency = getAccountCurrency(account);
  const balance = account.balance.toNumber();
  return <CounterValueCell currency={currency} balance={balance} />;
}
