import {
  IconAccount,
  Transaction,
  TransactionStatus,
  IconOperation,
} from "@ledgerhq/live-common/families/icon/types";
import { LLDCoinFamily } from "../types";

export type IconFamily = LLDCoinFamily<IconAccount, Transaction, TransactionStatus, IconOperation>;
