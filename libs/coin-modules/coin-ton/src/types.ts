import {
  Account,
  Operation,
  SubAccount,
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

export type TonOperation = Operation<TonOperationExtra>;

export type TonPayloadJettonTransfer = {
  type: "jetton-transfer";
  queryId: bigint | null;
  amount: bigint;
  destination: Address;
  responseDestination: Address;
  customPayload: TonCell | null;
  forwardAmount: bigint;
  forwardPayload: TonCell | null;
  knownJetton: {
    jettonId: number;
    workchain: number;
  } | null;
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

export type TonPayloadUnsafe = {
  type: "unsafe";
  message: TonCell;
};

export type TonPayloadJettonBurn = {
  type: "jetton-burn";
  queryId: bigint | null;
  amount: bigint;
  responseDestination: Address;
  customPayload: TonCell | Buffer | null;
};

export type TonPayloadAddWhitelist = {
  type: "add-whitelist";
  queryId: bigint | null;
  address: Address;
};

export type TonPayloadSingleNominatorWithdraw = {
  type: "single-nominator-withdraw";
  queryId: bigint | null;
  amount: bigint;
};

export type TonPayloadSingleNominatorChangeValidator = {
  type: "single-nominator-change-validator";
  queryId: bigint | null;
  address: Address;
};

export type TonPayloadTonStakersDeposit = {
  type: "tonstakers-deposit";
  queryId: bigint | null;
  appId: bigint | null;
};

export type TonPayloadVoteForProposal = {
  type: "vote-for-proposal";
  queryId: bigint | null;
  votingAddress: Address;
  expirationDate: number;
  vote: boolean;
  needConfirmation: boolean;
};

export type TonPayloadChangeDnsRecord = {
  type: "change-dns-record";
  queryId: bigint | null;
  record:
    | {
        type: "wallet";
        value: {
          address: Address;
          capabilities: {
            isWallet: boolean;
          } | null;
        } | null;
      }
    | {
        type: "unknown";
        key: Buffer;
        value: TonCell | null;
      };
};

export type TonPayloadTokenBridgePaySwap = {
  type: "token-bridge-pay-swap";
  queryId: bigint | null;
  swapId: Buffer;
};

export type TonPayloadFormat =
  | TonPayloadComment
  | TonPayloadJettonTransfer
  | TonPayloadNftTransfer
  | TonPayloadUnsafe
  | TonPayloadJettonBurn
  | TonPayloadAddWhitelist
  | TonPayloadSingleNominatorWithdraw
  | TonPayloadSingleNominatorChangeValidator
  | TonPayloadTonStakersDeposit
  | TonPayloadVoteForProposal
  | TonPayloadChangeDnsRecord
  | TonPayloadTokenBridgePaySwap;

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

export type TonOperationExtra = {
  comment: TonComment;
  lt: string;
  explorerHash: string;
};

export type KnownJetton = {
  symbol: string;
  masterAddress: Address;
};

export type TonSubAccount = SubAccount & {
  jettonWallet: string;
};
export type TonAccount = Omit<Account, "subAccounts"> & {
  subAccounts?: TonSubAccount[];
};
