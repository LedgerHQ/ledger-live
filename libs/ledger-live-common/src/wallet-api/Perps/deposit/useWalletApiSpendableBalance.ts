import { useEffect, useState } from "react";
import type BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { resolveWalletApiSpendableBalance } from "../../converters";

export type WalletApiSpendableBalance = Readonly<{
  balance: BigNumber | undefined;
  isRefreshing: boolean;
}>;

export function useWalletApiSpendableBalance(
  account: AccountLike | undefined,
  parentAccount: Account | undefined,
): WalletApiSpendableBalance {
  const [resolved, setResolved] = useState<{ account: AccountLike; balance: BigNumber } | null>(
    null,
  );

  useEffect(() => {
    if (!account) return;
    let stale = false;
    void resolveWalletApiSpendableBalance(account, parentAccount).then(balance => {
      if (!stale) setResolved({ account, balance });
    });
    return () => {
      stale = true;
    };
  }, [account, parentAccount]);

  const isSameAccount = account !== undefined && resolved?.account.id === account.id;
  return {
    balance: isSameAccount ? resolved?.balance : undefined,
    isRefreshing: isSameAccount && resolved?.account !== account,
  };
}
