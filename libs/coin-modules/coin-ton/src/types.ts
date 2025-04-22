import {
  Account,
  Operation,
  TokenAccount,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { Address, SendMode, StateInit, Cell } from "@ton/core";
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
  payload?: TonPayloadFormat;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fees: string;
  comment: TonComment;
  payload?: TonPayloadFormatRaw;
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

export type TonPayloadJettonTransferRaw = {
  type: "jetton-transfer";
  queryId: string | null;
  amount: string;
  destination: string;
  responseDestination: string;
  customPayload: string | null;
  forwardAmount: string;
  forwardPayload: string | null;
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

export type TonPayloadNftTransferRaw = {
  type: "nft-transfer";
  queryId: string | null;
  newOwner: string;
  responseDestination: string;
  customPayload: string | null;
  forwardAmount: string;
  forwardPayload: string | null;
};

export type TonPayloadComment = {
  type: "comment";
  text: string;
};

export type TonPayloadCommentRaw = {
  type: "comment";
  text: string;
};

export type TonPayloadUnsafe = {
  type: "unsafe";
  message: TonCell;
};

export type TonPayloadUnsafeRaw = {
  type: "unsafe";
  message: string;
};

export type TonPayloadJettonBurn = {
  type: "jetton-burn";
  queryId: bigint | null;
  amount: bigint;
  responseDestination: Address;
  customPayload: TonCell | Buffer | null;
};

export type TonPayloadJettonBurnRaw = {
  type: "jetton-burn";
  queryId: string | null;
  amount: string;
  responseDestination: string;
  customPayload: string | null;
};

export type TonPayloadAddWhitelist = {
  type: "add-whitelist";
  queryId: bigint | null;
  address: Address;
};

export type TonPayloadAddWhitelistRaw = {
  type: "add-whitelist";
  queryId: string | null;
  address: string;
};

export type TonPayloadSingleNominatorWithdraw = {
  type: "single-nominator-withdraw";
  queryId: bigint | null;
  amount: bigint;
};

export type TonPayloadSingleNominatorWithdrawRaw = {
  type: "single-nominator-withdraw";
  queryId: string | null;
  amount: string;
};

export type TonPayloadSingleNominatorChangeValidator = {
  type: "single-nominator-change-validator";
  queryId: bigint | null;
  address: Address;
};

export type TonPayloadSingleNominatorChangeValidatorRaw = {
  type: "single-nominator-change-validator";
  queryId: string | null;
  address: string;
};

export type TonPayloadTonStakersDeposit = {
  type: "tonstakers-deposit";
  queryId: bigint | null;
  appId: bigint | null;
};

export type TonPayloadTonStakersDepositRaw = {
  type: "tonstakers-deposit";
  queryId: string | null;
  appId: string | null;
};

export type TonPayloadVoteForProposal = {
  type: "vote-for-proposal";
  queryId: bigint | null;
  votingAddress: Address;
  expirationDate: number;
  vote: boolean;
  needConfirmation: boolean;
};

export type TonPayloadVoteForProposalRaw = {
  type: "vote-for-proposal";
  queryId: string | null;
  votingAddress: string;
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

export type TonPayloadChangeDnsRecordRaw = {
  type: "change-dns-record";
  queryId: string | null;
  record:
    | {
        type: "wallet";
        value: {
          address: string;
          capabilities: {
            isWallet: boolean;
          } | null;
        } | null;
      }
    | {
        type: "unknown";
        key: string;
        value: string | null;
      };
};

export type TonPayloadTokenBridgePaySwap = {
  type: "token-bridge-pay-swap";
  queryId: bigint | null;
  swapId: Buffer;
};

export type TonPayloadTokenBridgePaySwapRaw = {
  type: "token-bridge-pay-swap";
  queryId: string | null;
  swapId: string;
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

export type TonPayloadFormatRaw =
  | TonPayloadCommentRaw
  | TonPayloadJettonTransferRaw
  | TonPayloadNftTransferRaw
  | TonPayloadUnsafeRaw
  | TonPayloadJettonBurnRaw
  | TonPayloadAddWhitelistRaw
  | TonPayloadSingleNominatorWithdrawRaw
  | TonPayloadSingleNominatorChangeValidatorRaw
  | TonPayloadTonStakersDepositRaw
  | TonPayloadVoteForProposalRaw
  | TonPayloadChangeDnsRecordRaw
  | TonPayloadTokenBridgePaySwapRaw;

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

export type TonSubAccount = TokenAccount & {
  jettonWallet: string;
};
export type TonAccount = Omit<Account, "subAccounts"> & {
  subAccounts?: TonSubAccount[];
};
