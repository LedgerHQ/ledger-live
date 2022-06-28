import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export type Transaction = TransactionCommon & {
  family: "celo";
  fees: BigNumber | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "celo";
  fees: string | null | undefined;
};
