import {
  StacksAccount,
  StacksOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/stacks/types";
import { LLDCoinFamily } from "../types";

export type StacksFamily = LLDCoinFamily<
  StacksAccount,
  Transaction,
  TransactionStatus,
  StacksOperation
>;
