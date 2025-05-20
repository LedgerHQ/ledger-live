import { Account, AccountBridge, Bridge } from "@ledgerhq/types-live";
import { Transaction, TransactionRaw } from ".";

export enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

export type AptosAccountBridge = AccountBridge<Transaction, Account>;
export type AptosBridge = Bridge<Transaction, TransactionRaw>;
