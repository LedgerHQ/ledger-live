import React from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { CounterValueCell } from "LLD/components/Cells/CounterValueCell";
import { getDomainCurrencyForAccount } from "~/renderer/lib/getDomainCurrencyForAccount";

export function AccountValueCell({ account }: { readonly account: AccountLike }) {
  const currency = getDomainCurrencyForAccount(account);
  const balance = account.balance.toNumber();
  return <CounterValueCell currency={currency} balance={balance} />;
}
