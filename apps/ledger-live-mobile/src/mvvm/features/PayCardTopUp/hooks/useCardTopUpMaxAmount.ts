import { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

type Estimate = Readonly<{ account: AccountLike; value: BigNumber }>;

/**
 * The provider signs the exact amount, so fees cannot be taken out of it later:
 * the ratio pills and MAX work from the bridge's worst-case spendable amount.
 */
export function useCardTopUpMaxAmount(account: AccountLike, parentAccount?: Account) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    let active = true;

    getAccountBridge(account, parentAccount)
      .then(bridge => bridge.estimateMaxSpendable({ account, parentAccount }))
      .then(value => {
        if (active) setEstimate({ account, value: BigNumber.min(value, account.spendableBalance) });
      })
      .catch(() => {
        if (active) setEstimate(null);
      });

    return () => {
      active = false;
    };
  }, [account, parentAccount]);

  return estimate?.account === account ? estimate.value : null;
}
