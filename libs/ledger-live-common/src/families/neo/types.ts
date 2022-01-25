import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";
export type CoreStatics = Record<string, never>;
export type CoreAccountSpecifics = Record<string, never>;
export type CoreOperationSpecifics = Record<string, never>;
export type CoreCurrencySpecifics = Record<string, never>;
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
export const reflect = (_declare: any) => {};
