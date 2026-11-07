import React from "react";
import type { AccountDataSignTransactionParams } from "@features/platform-wallet-api-server";
import { TransactionSignView } from "./TransactionSignView";
import { useTransactionSignViewModel } from "./useTransactionSignViewModel";

type Props = Readonly<{ requestId: number; params: AccountDataSignTransactionParams }>;

export function TransactionSign({ requestId, params }: Props) {
  return <TransactionSignView {...useTransactionSignViewModel(requestId, params)} />;
}
