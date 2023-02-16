import { Account, AccountLike } from "@ledgerhq/types-live";
import byFamily from "../generated/platformAdapter";
import type { Transaction } from "../generated/types";
import { isTokenAccount, isSubAccount } from "../account";
import {
  PlatformAccount,
  PlatformCurrency,
  PlatformTransaction,
  PlatformCurrencyType,
  PlatformTokenStandard,
  PlatformSupportedCurrency,
} from "./types";

export function accountToPlatformAccount(
  account: AccountLike,
  parentAccount?: Account
): PlatformAccount {
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

export function currencyToPlatformCurrency(
  currency: PlatformSupportedCurrency
): PlatformCurrency {
  if (currency.type === "TokenCurrency") {
    return {
      type: PlatformCurrencyType.TokenCurrency,
      standard: PlatformTokenStandard.ERC20,
      id: currency.id,
      ticker: currency.ticker,
      contract: currency.contractAddress,
      name: currency.name,
      parent: currency.parentCurrency.id,
      color: currency.parentCurrency.color,
      units: currency.units.map((unit) => ({
        name: unit.name,
        code: unit.code,
        magnitude: unit.magnitude,
      })),
    };
  }

  return {
    type: PlatformCurrencyType.CryptoCurrency,
    id: currency.id,
    ticker: currency.ticker,
    name: currency.name,
    family: currency.family,
    color: currency.color,
    units: currency.units.map((unit) => ({
      name: unit.name,
      code: unit.code,
      magnitude: unit.magnitude,
    })),
  };
}

export const getPlatformTransactionSignFlowInfos = (
  platformTx: PlatformTransaction
): {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
} => {
  const family = byFamily[platformTx.family];

  if (family) {
    return family.getPlatformTransactionSignFlowInfos(platformTx);
  }

  return {
    canEditFees: false,
    liveTx: { ...platformTx } as Partial<Transaction>,
    hasFeesProvided: false,
  };
};
