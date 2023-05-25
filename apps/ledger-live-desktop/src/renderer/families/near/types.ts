import {
  NearAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/near/types";
import { LLDCoinFamily } from "../types";
import { ModalsData } from "./modals";

export type NearFamily = LLDCoinFamily<NearAccount, Transaction, TransactionStatus, ModalsData>;
