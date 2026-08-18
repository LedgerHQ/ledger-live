import React, { useEffect } from "react";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import {
  isShieldedTransfer,
  type Transaction as ZcashTransaction,
} from "@ledgerhq/coin-zcash/types";
import { useZcashShieldedSync } from "./useZcashShieldedSync";

type Props = {
  account: Account;
  transaction: Transaction;
  operation: Operation;
};

const ZcashPostBroadcastSync = ({ account, transaction }: Props) => {
  const { startShieldedSync } = useZcashShieldedSync(account as ZcashAccount);
  const tx = transaction as unknown as ZcashTransaction;
  const isZcashPrivateSend = account.currency.id === "zcash" && isShieldedTransfer(tx);

  useEffect(() => {
    if (isZcashPrivateSend) startShieldedSync();
    // Runs once per mount (one broadcast = one mount of this component).
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default ZcashPostBroadcastSync;
