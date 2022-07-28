import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string;
};
