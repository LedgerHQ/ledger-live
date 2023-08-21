import {
  BitcoinAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { LLDCoinFamily } from "../types";
import { AccountDescriptor } from "@ledgerhq/live-common/families/bitcoin/descriptor";

export type BitcoinFamily = LLDCoinFamily<BitcoinAccount, Transaction, TransactionStatus>;

export type ScannedDescriptor = {
  descriptor: AccountDescriptor;
};
