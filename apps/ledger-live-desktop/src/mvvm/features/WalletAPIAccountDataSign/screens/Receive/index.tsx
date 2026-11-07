import React from "react";
import type { AccountDataReceiveParams } from "@features/platform-wallet-api-server";
import { ReceiveView } from "./ReceiveView";
import { useReceiveViewModel } from "./useReceiveViewModel";

type Props = Readonly<{ requestId: number; params: AccountDataReceiveParams }>;

export function Receive({ requestId, params }: Props) {
  return <ReceiveView {...useReceiveViewModel(requestId, params)} />;
}
