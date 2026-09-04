import { MemoNotSupported, StringMemo } from "@ledgerhq/coin-module-framework/api/types";

// TODO: remove after LIVE-35735 — generic adapter will produce StringMemo<"transferId"> directly
export interface FrameworkTransferIdMemo {
  type: "transferId";
  value: string;
}

export type CasperMemo = MemoNotSupported | StringMemo<"transferId"> | FrameworkTransferIdMemo;
