import { LLDCoinFamily } from "../types";
import {
  CardanoAccount,
  CardanoOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";

export type CardanoFamily = LLDCoinFamily<
  CardanoAccount,
  Transaction,
  TransactionStatus,
  CardanoOperation
>;
