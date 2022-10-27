import { Account, AccountLike } from "@ledgerhq/types-live";
import byFamily from "../generated/platformAdapter";
import type { Transaction } from "../generated/types";
import { isTokenAccount, isSubAccount } from "../account";
import {
  WalletAPIAccount,
  WalletAPICurrency,
  WalletAPITransaction,
  WalletAPISupportedCurrency,
} from "./types";
import { Families } from "@ledgerhq/wallet-api-core";

export function accountToWalletAPIAccount(
  account: AccountLike,
  parentAccount?: Account
): WalletAPIAccount {
  if (isSubAccount(account)) {
    if (!parentAccount) {
      throw new Error("No 'parentAccount' account provided for token account");
    }

    return {
      id: account.id,
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
    id: account.id,
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
    if (currency.parentCurrency.family !== "ethereum") {
      throw new Error("Only ERC20 tokens are supported");
    }

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

export const getWalletAPITransactionSignFlowInfos = (
  tx: WalletAPITransaction
): {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
} => {
  const family = byFamily[tx.family];

  if (family) {
    return family.getPlatformTransactionSignFlowInfos(tx);
  }

  return {
    canEditFees: false,
    liveTx: { ...tx } as Partial<Transaction>,
    hasFeesProvided: false,
  };
};
