import {
  BitcoinAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { LLDCoinFamily } from "../types";
import { AccountDescriptor } from "@ledgerhq/live-common/families/bitcoin/descriptor";
import { Operation } from "@ledgerhq/types-live";

export type BitcoinFamily = LLDCoinFamily<
  BitcoinAccount,
  Transaction,
  TransactionStatus,
  Operation
>;

export type ScannedDescriptor = {
  descriptor: AccountDescriptor;
};
