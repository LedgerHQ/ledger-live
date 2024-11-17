import type {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationRaw,
  SignedOperation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

import type { BigNumber } from "bignumber.js";

export type KaspaAccount = Account & {
  nextChangeAddress: string;
  nextChangeAddressType: number;
  nextChangeAddressIndex: number;
  nextReceiveAddress: string;
  nextReceiveAddressType: number;
  nextReceiveAddressIndex: number;
};

export type KaspaAccountRaw = AccountRaw & {
  later: "maybe";
};

export type KaspaSignedOperation = SignedOperation & {
  signedTxJson: string;
};

export type KaspaOperation = Operation;

export type KaspaOperationRaw = OperationRaw;

export type KaspaOperationExtra = OperationExtra & {
  later: "maybe";
};
export type KaspaOperationExtraRaw = OperationExtraRaw & {
  later: "maybe";
};

export type KaspaOperationType = "IN" | "OUT";

export type KaspaPreviousOutpoint = {
  transactionId: string;
  index: number;
};

export type KaspaTransactionInput = {
  previousOutpoint: KaspaPreviousOutpoint;
  signatureScript: string;
  sequence: number;
  sigOpCount: number;
  signature?: string | null;
  sighash?: string | null;
  value: number;
  addressType: number;
  addressIndex: number;
};

export type KaspaScriptPublicKey = {
  version: number;
  scriptPublicKey: string;
};

export type KaspaTransactionOutput = {
  amount: number;
  scriptPublicKey: KaspaScriptPublicKey;
  addressType?: number;
  addressIndex?: number;
};

export type KaspaTransaction = TransactionCommon & {
  inputs?: KaspaTransactionInput[];
  outputs?: KaspaTransactionOutput[] | null;
  family: "kaspa";
  feerate: number | null;
  rbf: boolean;
};

export type KaspaTransactionRaw = TransactionCommonRaw & {
  inputs?: KaspaTransactionInput[];
  outputs?: KaspaTransactionOutput[] | null;
  family: "kaspa";
  feerate: number | null;
  rbf: boolean;
};

export type KaspaTransactionStatus = TransactionStatusCommon & {
  later: "maybe";
};
export type KaspaTransactionStatusRaw = TransactionStatusCommonRaw & {
  later: "maybe";
};

type KaspaOutpoint = {
  transactionId: string;
  index: number;
};

export type KaspaUtxo = {
  address: string;
  accountType: number;
  accountIndex: number;
  outpoint: KaspaOutpoint;
  utxoEntry: {
    amount: BigNumber;
    scriptPublicKey: {
      version: number;
      scriptPublicKey: string;
    };
    blockDaaScore: string;
    isCoinbase: boolean;
  };
};
