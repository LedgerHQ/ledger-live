import type {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

import type { BigNumber } from "bignumber.js";
import { Transaction } from "../../lib/types";

export type KaspaAccount = Account;

export type KaspaAccountRaw = AccountRaw & {
  later: "maybe";
};

export type KaspaOperation = Operation & {
  later: "maybe";
};

export type KaspaOperationRaw = OperationRaw & {
  later: "maybe";
};

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
};

// TODO: implement rbf functions
export type KaspaTransaction = {
  version: number;
  inputs: KaspaTransactionInput[];
  outputs: KaspaTransactionOutput[] | null;
  locktime: number;
  subnetworkId: string;
};

export type KaspaTransactionCommon = TransactionCommon & {
  fees: number | null;
  rbf: boolean;
};

export type KaspaTransactionCommonRaw = TransactionCommonRaw & {
  family: "kaspa";
  fees: BigNumber | null | undefined;
  rbf: boolean;
};

export type KaspaTransactionStatusCommon = TransactionStatusCommon & {
  later: "maybe";
};
export type KaspaTransactionStatusCommonRaw = TransactionStatusCommonRaw & {
  later: "maybe";
};
