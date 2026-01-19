import {
  BitcoinAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { LLDCoinFamily } from "../types";
import { Operation } from "@ledgerhq/types-live";

export type BitcoinFamily = LLDCoinFamily<
  BitcoinAccount,
  Transaction,
  TransactionStatus,
  Operation
>;
