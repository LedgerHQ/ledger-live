import React from "react";
import { useSendFlowData } from "../../../context/SendFlowContext";
import ZcashSyncStateBanner from "~/renderer/families/bitcoin/ZcashSyncStateBanner";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";

function isZcashAccount(account: unknown): account is ZcashAccount {
  return (
    typeof account === "object" &&
    account !== null &&
    "currency" in account &&
    (account as { currency: { id: string } }).currency.id === "zcash"
  );
}

function resolvePrivateSender(transaction: unknown): "public" | "private" | undefined {
  if (typeof transaction === "object" && transaction !== null && "sender" in transaction) {
    const { sender } = transaction as { sender?: "public" | "private" };
    return sender ?? undefined;
  }
  return undefined;
}

export function ZcashSyncNotice() {
  const { state } = useSendFlowData();
  const account = state.account.account;
  const transaction = state.transaction.transaction;

  if (!isZcashAccount(account)) return null;

  const sender = resolvePrivateSender(transaction);
  if (sender !== "private") return null;

  return <ZcashSyncStateBanner account={account} sender={sender} />;
}
