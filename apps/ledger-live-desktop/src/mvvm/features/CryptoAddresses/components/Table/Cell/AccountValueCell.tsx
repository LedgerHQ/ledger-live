import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { CounterValueCell } from "LLD/components/Cells/CounterValueCell";
import { getAccountCurrency } from "~/renderer/lib/getDomainCurrencyForAccount";

export function AccountValueCell({ account }: { readonly account: AccountLike }) {
  const currency = getAccountCurrency(account);
  const balance = account.balance.toNumber();
  return <CounterValueCell currency={currency} balance={balance} />;
}
