import {
  BitcoinAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { LLDCoinFamily } from "../types";

export type BitcoinFamily = LLDCoinFamily<BitcoinAccount, Transaction, TransactionStatus>;
