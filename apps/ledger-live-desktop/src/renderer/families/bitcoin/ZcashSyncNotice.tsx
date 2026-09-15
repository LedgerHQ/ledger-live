import React, { useEffect } from "react";
import type {
  BitcoinAccount,
  Transaction,
  ZcashAccount,
} from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction as ZcashTransaction } from "@ledgerhq/coin-zcash/types";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import { accountSelector } from "~/renderer/reducers/accounts";
import ZcashSyncStateBanner from "./ZcashSyncStateBanner";

type Props = Readonly<{
  account: BitcoinAccount;
  transaction: Transaction;
  onBlockedChange?: (blocked: boolean) => void;
}>;

export function ZcashSyncNotice({ account, transaction, onBlockedChange }: Props) {
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  const isZcash = account.currency.id === "zcash";
  const sender = (transaction as unknown as ZcashTransaction).sender;

  // The `account` prop is a snapshot captured when the send flow opened, so read
  // the live account to reflect shielded sync progress in real time (falling back
  // to the prop when the account is not in the store, e.g. in unit tests).
  const liveAccount = useSelector(state => accountSelector(state, { accountId: account.id })) as
    | ZcashAccount
    | undefined;
  const activeAccount = liveAccount ?? (account as ZcashAccount);

  const applies = shieldedEnabled && isZcash && sender === "private";
  const syncState = activeAccount.privateInfo?.syncState ?? "disabled";
  const blocked = applies && syncState !== "complete";

  useEffect(() => {
    onBlockedChange?.(blocked);
  }, [blocked, onBlockedChange]);

  useEffect(() => () => onBlockedChange?.(false), [onBlockedChange]);

  if (!applies) return null;

  return <ZcashSyncStateBanner account={activeAccount} sender={sender} />;
}
