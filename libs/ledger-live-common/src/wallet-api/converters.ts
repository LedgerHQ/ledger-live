import { Account, AccountLike } from "@ledgerhq/types-live";
import { v5 as uuidv5 } from "uuid";
import byFamily from "../generated/walletApiAdapter";
import type { Transaction } from "../generated/types";
import { isTokenAccount, isSubAccount } from "../account";
import {
  WalletAPIAccount,
  WalletAPICurrency,
  WalletAPITransaction,
  WalletAPISupportedCurrency,
  GetWalletAPITransactionSignFlowInfos,
} from "./types";
import { Families } from "@ledgerhq/wallet-api-core";

// The namespace is a randomly generated uuid v4 from https://www.uuidgenerator.net/
const NAMESPACE = "c3c78073-6844-409e-9e75-171ab4c7f9a2";
const uuidToAccountId = new Map<string, string>();

export const getAccountIdFromWalletAccountId = (
  walletAccountId: string
): string | undefined => uuidToAccountId.get(walletAccountId);

export function accountToWalletAPIAccount(
  account: AccountLike,
  parentAccount?: Account
): WalletAPIAccount {
  const walletApiId = uuidv5(account.id, NAMESPACE);
  uuidToAccountId.set(walletApiId, account.id);

  if (isSubAccount(account)) {
    if (!parentAccount) {
      throw new Error("No 'parentAccount' account provided for token account");
    }

    return {
      id: walletApiId,
      balance: account.balance,
      address: parentAccount.freshAddress,
      blockHeight: parentAccount.blockHeight,
      lastSyncDate: parentAccount.lastSyncDate,
      ...(isTokenAccount(account)
        ? {
            name: `${parentAccount.name} (${account.token.ticker})`,
            currency: account.token.id,
            spendableBalance: account.spendableBalance,
          }
        : {
            name: account.name,
            currency: account.currency.id,
            spendableBalance: parentAccount.spendableBalance,
          }),
    };
  }

  return {
    id: walletApiId,
    name: account.name,
    address: account.freshAddress,
    currency: account.currency.id,
    balance: account.balance,
    spendableBalance: account.spendableBalance,
    blockHeight: account.blockHeight,
    lastSyncDate: account.lastSyncDate,
  };
}

export function currencyToWalletAPICurrency(
  currency: WalletAPISupportedCurrency
): WalletAPICurrency {
  if (currency.type === "TokenCurrency") {
    return {
      type: "TokenCurrency",
      standard: "ERC20",
      id: currency.id,
      ticker: currency.ticker,
      contract: currency.contractAddress,
      name: currency.name,
      parent: currency.parentCurrency.id,
      color: currency.parentCurrency.color,
      decimals: currency.units[0].magnitude,
    };
  }

  return {
    type: "CryptoCurrency",
    id: currency.id,
    ticker: currency.ticker,
    name: currency.name,
    family: currency.family as Families,
    color: currency.color,
    decimals: currency.units[0].magnitude,
  };
}

export const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPITransaction,
  Transaction
> = (tx) => {
  const family = byFamily[tx.family];

  if (family) {
    return family.getWalletAPITransactionSignFlowInfos(tx);
  }

  return {
    canEditFees: false,
    liveTx: { ...tx } as Partial<Transaction>,
    hasFeesProvided: false,
  };
};
