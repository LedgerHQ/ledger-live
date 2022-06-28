import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "neo";
};
export type NetworkInfoRaw = {
  family: "neo";
};
export type Transaction = TransactionCommon & {
  family: "neo";
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "neo";
};
