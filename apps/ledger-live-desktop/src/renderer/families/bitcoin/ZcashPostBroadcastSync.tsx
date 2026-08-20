import React, { useEffect, useRef } from "react";
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

const ZCASH_POST_BROADCAST_SYNC_RETRY_COUNT = 8;
const ZCASH_POST_BROADCAST_SYNC_RETRY_INTERVAL_MS = 90_000;

const ZcashPostBroadcastSync = ({ account, transaction }: Props) => {
  const { startShieldedSync } = useZcashShieldedSync(account as ZcashAccount);
  const tx = transaction as unknown as ZcashTransaction;
  const isZcashPrivateSend = account.currency.id === "zcash" && isShieldedTransfer(tx);

  const startShieldedSyncRef = useRef(startShieldedSync);
  startShieldedSyncRef.current = startShieldedSync;

  useEffect(() => {
    if (!isZcashPrivateSend) return;

    let remainingAttempts = ZCASH_POST_BROADCAST_SYNC_RETRY_COUNT;

    const attempt = () => {
      startShieldedSyncRef.current();
      remainingAttempts -= 1;
      if (remainingAttempts > 0) {
        setTimeout(attempt, ZCASH_POST_BROADCAST_SYNC_RETRY_INTERVAL_MS);
      }
    };
    attempt();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isZcashPrivateSend]);

  return null;
};

export default ZcashPostBroadcastSync;
