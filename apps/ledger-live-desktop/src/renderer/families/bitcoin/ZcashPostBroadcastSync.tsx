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

// The shielded sync scans to the current chain tip and completes -- it doesn't
// poll. A freshly-broadcast tx isn't mined yet, so a single post-broadcast
// attempt scans past it and finds nothing. Retry over a window, spaced by
// roughly Zcash's ~75s block interval, so an attempt lands after it's mined --
// confirmation time varies, so this is a wide-enough budget, not a guarantee.
const ZCASH_POST_BROADCAST_SYNC_RETRY_COUNT = 8;
const ZCASH_POST_BROADCAST_SYNC_RETRY_INTERVAL_MS = 90_000;

const ZcashPostBroadcastSync = ({ account, transaction }: Props) => {
  const { startShieldedSync } = useZcashShieldedSync(account as ZcashAccount);
  const tx = transaction as unknown as ZcashTransaction;
  const isZcashPrivateSend = account.currency.id === "zcash" && isShieldedTransfer(tx);

  // Retries call the latest startShieldedSync, not the one from mount --
  // otherwise its anti-spam guard checks against a stale subscription list.
  const startShieldedSyncRef = useRef(startShieldedSync);
  startShieldedSyncRef.current = startShieldedSync;

  useEffect(() => {
    if (!isZcashPrivateSend) return;

    let remainingAttempts = ZCASH_POST_BROADCAST_SYNC_RETRY_COUNT;
    let timeoutId: ReturnType<typeof setTimeout>;

    const attempt = () => {
      startShieldedSyncRef.current();
      remainingAttempts -= 1;
      if (remainingAttempts > 0) {
        timeoutId = setTimeout(attempt, ZCASH_POST_BROADCAST_SYNC_RETRY_INTERVAL_MS);
      }
    };
    attempt();

    return () => clearTimeout(timeoutId);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- re-schedule only on isZcashPrivateSend, not on every account update the retries cause
  }, [isZcashPrivateSend]);

  return null;
};

export default ZcashPostBroadcastSync;
