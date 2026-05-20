import type { StringMemo, TxDataNotSupported } from "@ledgerhq/coin-module-framework/api/types";

export type HederaMemo = StringMemo;

export type HederaTxData =
  | TxDataNotSupported
  | {
      type: "erc20";
      gasLimit: bigint;
    }
  | {
      type: "staking";
      stakingNodeId: number | null | undefined;
    };
