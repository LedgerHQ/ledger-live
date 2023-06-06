import { LLDCoinFamily } from "../types";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";

export type CardanoFamily = LLDCoinFamily<CardanoAccount, Transaction, TransactionStatus>;
