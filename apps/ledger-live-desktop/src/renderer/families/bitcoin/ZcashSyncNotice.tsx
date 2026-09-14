import React, { useEffect } from "react";
import type {
  BitcoinAccount,
  Transaction,
  ZcashAccount,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import { accountSelector } from "~/renderer/reducers/accounts";
import ZcashSyncStateBanner from "./ZcashSyncStateBanner";

type Props = Readonly<{
  account: BitcoinAccount;
  transaction: Transaction;
  onBlockedChange?: (blocked: boolean) => void;
}>;

// A private send must not reach signing until the shielded sync has a complete
// note set, otherwise the transaction could be built from stale notes. Only
// "complete"/"ready" are safe; every other state (running, stopped, disabled,
// outdated, failed) shows a banner and blocks the recipient step.
const READY_SYNC_STATES = new Set(["complete", "ready"]);

export function ZcashSyncNotice({ account, transaction, onBlockedChange }: Props) {
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  const isZcash = account.currency.id === "zcash";
  const sender = "sender" in transaction ? transaction.sender : undefined;

  // The `account` prop is a snapshot captured when the send flow opened, so read
  // the live account to reflect shielded sync progress in real time (falling back
  // to the prop when the account is not in the store, e.g. in unit tests).
  const liveAccount = useSelector(state => accountSelector(state, { accountId: account.id })) as
    | ZcashAccount
    | undefined;
  const activeAccount = liveAccount ?? (account as ZcashAccount);

  const applies = shieldedEnabled && isZcash && sender === "private";
  const syncState = activeAccount.privateInfo?.syncState ?? "disabled";
  const blocked = applies && !READY_SYNC_STATES.has(syncState);

  useEffect(() => {
    onBlockedChange?.(blocked);
  }, [blocked, onBlockedChange]);

  useEffect(() => () => onBlockedChange?.(false), [onBlockedChange]);

  if (!applies) return null;

  return <ZcashSyncStateBanner account={activeAccount} sender={sender} />;
}
