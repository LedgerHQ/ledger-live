import React, { useEffect } from "react";
import type {
  Transaction,
  TransactionStatus,
  ZcashAccount,
} from "@ledgerhq/coin-zcash/types/bridge";
import { useZcashShieldedSync } from "./useZcashShieldedSync";
import ZcashSyncStateBanner from "./ZcashSyncStateBanner";

type Props = {
  account: ZcashAccount;
  transaction: Transaction;
  status: TransactionStatus;
};

/**
 * Zcash prices fees with ZIP-317 (deterministic, action-based): there is no fee market, so
 * there is no fee selector. A send from the private pool needs the shielded state up to date,
 * so it starts a shielded sync and shows its progress.
 */
const Fields = ({ account, transaction }: Props) => {
  const { startShieldedSync } = useZcashShieldedSync(account);

  useEffect(() => {
    if (transaction.sender === "private") startShieldedSync();
    // Re-fire only when the source account or the chosen pool changes, not on
    // every amount keystroke.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id, transaction.sender]);

  return transaction.sender === "private" ? (
    <ZcashSyncStateBanner account={account} sender={transaction.sender} />
  ) : null;
};

export default {
  component: Fields,
  fields: [],
};
