import React from "react";
import type {
  BitcoinAccount,
  Transaction,
  ZcashAccount,
} from "@ledgerhq/live-common/families/bitcoin/types";
import ZcashSyncStateBanner from "./ZcashSyncStateBanner";

type Props = Readonly<{
  account: BitcoinAccount;
  transaction: Transaction;
}>;

export function ZcashSyncNotice({ account, transaction }: Props) {
  if (account.currency.id !== "zcash") return null;

  const sender = "sender" in transaction ? transaction.sender : undefined;
  if (sender !== "private") return null;

  return <ZcashSyncStateBanner account={account as ZcashAccount} sender={sender} />;
}
