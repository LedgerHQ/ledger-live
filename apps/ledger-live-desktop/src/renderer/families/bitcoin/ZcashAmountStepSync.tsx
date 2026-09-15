import React, { useEffect } from "react";
import type {
  BitcoinAccount,
  Transaction,
  ZcashAccount,
} from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction as ZcashTransaction } from "@ledgerhq/coin-zcash/types";
import { useZcashShieldedSync } from "./useZcashShieldedSync";

type Props = Readonly<{
  account: BitcoinAccount;
  transaction: Transaction;
}>;

/**
 * Starts the shielded resync as soon as the Amount step is entered with a
 * private source pool, so the note set is fresh by the time the user reaches
 * signing. Inert for every other currency and for a transparent-pool Zcash
 * send. Mirrors the legacy `SendAmountFields` trigger: keyed on the account and
 * the chosen pool only, so a keystroke in the amount field never restarts it.
 */
export function ZcashAmountStepSync({ account, transaction }: Props) {
  const isZcash = account.currency.id === "zcash";
  const sender = (transaction as unknown as ZcashTransaction).sender;
  const { startShieldedSync } = useZcashShieldedSync(account as ZcashAccount);

  useEffect(() => {
    if (isZcash && sender === "private") startShieldedSync();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id, sender]);

  return null;
}
