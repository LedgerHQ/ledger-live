import {
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { Address, SendMode, StateInit } from "@ton/core";
import { Cell } from "@ton/ton";
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

export type TonPayloadJettonTransfer = {
  type: "jetton-transfer";
  queryId: bigint | null;
  amount: bigint;
  destination: Address;
  responseDestination: Address;
  customPayload: TonCell | null;
  forwardAmount: bigint;
  forwardPayload: TonCell | null;
};

export type TonPayloadNftTransfer = {
  type: "nft-transfer";
  queryId: bigint | null;
  newOwner: Address;
  responseDestination: Address;
  customPayload: TonCell | null;
  forwardAmount: bigint;
  forwardPayload: TonCell | null;
};

export type TonPayloadComment = {
  type: "comment";
  text: string;
};

export type TonPayloadFormat = TonPayloadComment | TonPayloadJettonTransfer | TonPayloadNftTransfer;

export interface TonTransaction {
  to: Address;
  sendMode: SendMode;
  seqno: number;
  timeout: number;
  bounce: boolean;
  amount: bigint;
  stateInit?: StateInit;
  payload?: TonPayloadFormat;
}

export interface TonCell extends Cell {}
