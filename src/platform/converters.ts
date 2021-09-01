import byFamily from "../generated/platformAdapter";

import type { Account, CryptoCurrency, Transaction } from "../types";
import type {
  PlatformAccount,
  PlatformCurrency,
  PlatformTransaction,
} from "./types";

export function accountToPlatformAccount(account: Account): PlatformAccount {
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
  currency: CryptoCurrency
): PlatformCurrency {
  return {
    type: currency.type,
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
