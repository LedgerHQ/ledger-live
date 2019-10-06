// @flow
import { AccountNotSupported, CurrencyNotSupported } from "@ledgerhq/errors";
import type { Account, CryptoCurrency, DerivationMode } from "../types";
import { getEnv } from "../env";
import { decodeAccountId } from "./accountId";
import {
  getAllDerivationModes,
  getDerivationModesForCurrency
} from "../derivation";
import { isCurrencySupported } from "../currencies";

export const libcoreNoGo = [
  "ripple", // still WIP
  "ethereum_classic", // LLC-308
  "tron",
  "neo"
];

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

export function canBeMigrated(account: Account) {
  const { type } = decodeAccountId(account.id);
  if (libcoreNoGo.includes(account.currency.id)) return false;
  return type === "ethereumjs";
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
