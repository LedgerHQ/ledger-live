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

export type KaspaAccount = Account & {
  later: "maybe";
};

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

export type KaspaTransaction = TransactionCommon & {
  family: "kaspa";
  fees: BigNumber | null | undefined;
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
