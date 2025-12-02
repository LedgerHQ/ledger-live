import type {
  Block,
  BlockTransaction,
  StringMemo,
  TxDataNotSupported,
  AccountTransaction,
} from "@ledgerhq/coin-framework/api/types";

export type HederaMemo = StringMemo;

export type HederaTxData =
  | TxDataNotSupported
  | {
      type: "erc20";
      gasLimit: bigint;
    };

export type HederaBlock = Block<HederaMemo>;
export type HederaBlockTransaction = BlockTransaction<HederaMemo>;
export type HederaAccountTransaction = AccountTransaction<HederaMemo>;
