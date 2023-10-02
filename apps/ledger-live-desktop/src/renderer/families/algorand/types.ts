import {
  AlgorandAccount,
  AlgorandOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/algorand/types";
import { LLDCoinFamily } from "../types";

export type AlgorandFamily = LLDCoinFamily<
  AlgorandAccount,
  Transaction,
  TransactionStatus,
  AlgorandOperation
>;
