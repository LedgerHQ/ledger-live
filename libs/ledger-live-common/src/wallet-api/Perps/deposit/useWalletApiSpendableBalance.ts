import { useEffect, useState } from "react";
import type BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { resolveWalletApiSpendableBalance } from "../../converters";

export function useWalletApiSpendableBalance(
  account: AccountLike | undefined,
  parentAccount: Account | undefined,
): BigNumber | undefined {
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

  return resolved && resolved.account === account ? resolved.balance : undefined;
}
