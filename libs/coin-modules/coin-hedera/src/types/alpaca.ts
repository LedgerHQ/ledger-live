import type { StringMemo, TxDataNotSupported } from "@ledgerhq/coin-framework/api/types";

export type HederaMemo = StringMemo;

export type HederaTxData =
  | TxDataNotSupported
  | {
      type: "erc20";
      gasLimit: bigint;
    };
