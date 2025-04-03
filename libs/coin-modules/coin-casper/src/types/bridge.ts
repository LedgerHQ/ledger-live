import { AccountBridge, Bridge } from "@ledgerhq/types-live";
import { Transaction, TransactionRaw } from "./common";

export type CasperAccountBridge = AccountBridge<Transaction>;
export type CasperBridge = Bridge<Transaction, TransactionRaw>;
