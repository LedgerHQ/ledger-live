import {
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { TonPayloadFormat } from "@ton-community/ton-ledger";
import { Address, SendMode, StateInit } from "@ton/core";
import BigNumber from "bignumber.js";

type FamilyType = "ton";

// ledger app does not support encrypted comments yet
// leaving the arch for the future
export interface TonComment {
  isEncrypted: boolean;
  text: string;
}

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  comment: TonComment;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fees: string;
  comment: TonComment;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TonOperation = Operation<{ comment: TonComment; lt: string; explorerHash: string }>;

export interface TonHwParams {
  to: Address;
  sendMode: SendMode;
  seqno: number;
  timeout: number;
  bounce: boolean;
  amount: bigint;
  stateInit?: StateInit;
  payload?: TonPayloadFormat;
}
