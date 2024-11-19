import { Account, AccountLike } from "@ledgerhq/types-live";
import { isTokenAccount } from "../account";
import byFamily from "../generated/platformAdapter";
import type { Transaction } from "../generated/types";
import {
  FAMILIES_MAPPING_LL_TO_PLATFORM,
  FAMILIES_MAPPING_PLATFORM_TO_LL,
  PlatformAccount,
  PlatformCurrency,
  PlatformCurrencyType,
  PlatformSupportedCurrency,
  PlatformTokenStandard,
  PlatformTransaction,
} from "./types";
import { WalletState, accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";

export function accountToPlatformAccount(
  walletState: WalletState,
  account: AccountLike,
  parentAccount?: Account,
): PlatformAccount {
  if (isTokenAccount(account)) {
    if (!parentAccount) {
      throw new Error("No 'parentAccount' account provided for token account");
    }

    const parentName = accountNameWithDefaultSelector(walletState, parentAccount);

    return {
      id: account.id,
      balance: account.balance,
      address: parentAccount.freshAddress,
      blockHeight: parentAccount.blockHeight,
      lastSyncDate: parentAccount.lastSyncDate,
      name: `${parentName} (${account.token.ticker})`,
      currency: account.token.id,
      spendableBalance: account.spendableBalance,
    };
  }

  const name = accountNameWithDefaultSelector(walletState, account);

  return {
    id: account.id,
    name,
    address: account.freshAddress,
    currency: account.currency.id,
    balance: account.balance,
    spendableBalance: account.spendableBalance,
    blockHeight: account.blockHeight,
    lastSyncDate: account.lastSyncDate,
  };
}

export function currencyToPlatformCurrency(currency: PlatformSupportedCurrency): PlatformCurrency {
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
      units: currency.units.map(unit => ({
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
    family: FAMILIES_MAPPING_LL_TO_PLATFORM[currency.family] ?? currency.family,
    color: currency.color,
    units: currency.units.map(unit => ({
      name: unit.name,
      code: unit.code,
      magnitude: unit.magnitude,
    })),
  };
}

export const getPlatformTransactionSignFlowInfos = (
  platformTx: PlatformTransaction,
): {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
} => {
  const liveFamily = FAMILIES_MAPPING_PLATFORM_TO_LL[platformTx.family] ?? platformTx.family;

  const familyModule = byFamily[liveFamily];

  if (familyModule) {
    return familyModule.getPlatformTransactionSignFlowInfos(platformTx);
  }

  return {
    canEditFees: false,
    liveTx: { ...platformTx } as Partial<Transaction>,
    hasFeesProvided: false,
  };
};
