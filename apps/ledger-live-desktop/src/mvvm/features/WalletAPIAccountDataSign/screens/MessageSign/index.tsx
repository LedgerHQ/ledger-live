import React from "react";
import type { AccountDataSignMessageParams } from "@features/platform-wallet-api-server";
import { MessageSignView } from "./MessageSignView";
import { useMessageSignViewModel } from "./useMessageSignViewModel";

type Props = Readonly<{ requestId: number; params: AccountDataSignMessageParams }>;

export function MessageSign({ requestId, params }: Props) {
  return <MessageSignView {...useMessageSignViewModel(requestId, params)} />;
}
