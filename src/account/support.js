// @flow
import {
  AccountNotSupported,
  CurrencyNotSupported,
  UnavailableTezosOriginatedAccountReceive
} from "@ledgerhq/errors";
import type {
  Account,
  AccountLike,
  CryptoCurrency,
  DerivationMode
} from "../types";
import { getEnv } from "../env";
import { decodeAccountId } from "./accountId";
import {
  getAllDerivationModes,
  getDerivationModesForCurrency
} from "../derivation";
import { isCurrencySupported } from "../currencies";
import { getMainAccount } from "../account";
import { getAccountBridge } from "../bridge";

export const libcoreNoGo = [
  "ripple", // still WIP
  "ethereum_classic", // LLC-308
  "tron",
  "neo"
];

export const libcoreNoGoBalanceHistory = () =>
  getEnv("LIBCORE_BALANCE_HISTORY_NOGO").split(",");

export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
) => {
  const modes = getDerivationModesForCurrency(currency);
  // last mode is always creatable by convention
  if (modes[modes.length - 1] === derivationMode) return true;
  // legacy is only available with flag SHOW_LEGACY_NEW_ACCOUNT
  if (derivationMode === "" && !!getEnv("SHOW_LEGACY_NEW_ACCOUNT")) return true;
  // native segwit being not yet supported everywhere, segwit is always available for creation
  if (derivationMode === "segwit") return true;
  return false;
};

export const getReceiveFlowError = (
  account: AccountLike,
  parentAccount: ?Account
): ?Error => {
  if (parentAccount && parentAccount.currency.id === "tezos") {
    return new UnavailableTezosOriginatedAccountReceive("");
  }
};

export function canSend(
  account: AccountLike,
  parentAccount: ?Account
): boolean {
  try {
    getAccountBridge(account, parentAccount).createTransaction(
      getMainAccount(account, parentAccount)
    );
    return true;
  } catch (e) {
    return false;
  }
}

export function canBeMigrated(account: Account) {
  try {
    const { type } = decodeAccountId(account.id);
    if (libcoreNoGo.includes(account.currency.id)) return false;
    return type === "ethereumjs";
  } catch (e) {
    return false;
  }
}

// attempt to find an account in scanned accounts that satisfy a migration
export function findAccountMigration(
  account: Account,
  scannedAccounts: Account[]
): ?Account {
  if (!canBeMigrated(account)) return;
  const { type } = decodeAccountId(account.id);
  if (type === "ethereumjs") {
    return scannedAccounts.find(
      a =>
        a.id !== account.id && // a migration assume an id changes
        a.currency === account.currency &&
        a.freshAddress === account.freshAddress
    );
  }
}

export function checkAccountSupported(account: Account): ?Error {
  if (!getAllDerivationModes().includes(account.derivationMode)) {
    return new AccountNotSupported(
      "derivation not supported " + account.derivationMode,
      { reason: account.derivationMode }
    );
  }

  if (!isCurrencySupported(account.currency)) {
    return new CurrencyNotSupported("currency not supported", {
      currencyName: account.currency.name
    });
  }
}
