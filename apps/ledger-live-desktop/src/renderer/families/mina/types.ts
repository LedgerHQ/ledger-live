import {
  MinaAccount,
  MinaOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/mina/types";
import { LLDCoinFamily } from "../types";

export type MinaFamily = LLDCoinFamily<MinaAccount, Transaction, TransactionStatus, MinaOperation>;
