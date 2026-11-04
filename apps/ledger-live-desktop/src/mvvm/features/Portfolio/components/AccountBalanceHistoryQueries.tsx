import React from "react";
import { useAccountData } from "@features/platform-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CountervalueTicker } from "@domain/entity-account-balance";
import type { Account, PortfolioRange } from "@ledgerhq/types-live";
import { useRefreshOnRevisionChange } from "LLD/hooks/useRefreshOnRevisionChange";
import { useBalanceHistoryRead } from "../hooks/useAccountDataPortfolioHistory";

function balanceRevision(account: Account): string {
  return [account, ...(account.subAccounts ?? [])].map(item => item.balance.toFixed()).join(":");
}

function AccountBalanceHistoryQuery({
  account,
  descriptor,
  range,
  countervalue,
}: Readonly<{
  account: Account;
  descriptor: AccountDescriptor;
  range: PortfolioRange;
  countervalue: CountervalueTicker;
}>) {
  const { refresh } = useAccountData("balanceHistory", descriptor, {
    query: { range, countervalue },
  });
  useRefreshOnRevisionChange(refresh, balanceRevision(account));
  return null;
}

export function AccountBalanceHistoryQueries({
  legacyRange = false,
}: Readonly<{ legacyRange?: boolean }>) {
  const read = useBalanceHistoryRead(legacyRange);
  if (!read) return null;

  return read.targets.map(target => (
    <AccountBalanceHistoryQuery
      key={target.accountUUID}
      account={target.account}
      descriptor={target.descriptor}
      range={read.range}
      countervalue={read.countervalue}
    />
  ));
}
