import {
  CosmosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import { LLDCoinFamily } from "../types";
import { ModalsData } from "./modals";

export type CosmosFamily = LLDCoinFamily<CosmosAccount, Transaction, TransactionStatus, ModalsData>;
