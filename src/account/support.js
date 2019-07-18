// @flow
import { AccountNotSupported, CurrencyNotSupported } from "@ledgerhq/errors";
import type { Account, CryptoCurrency, DerivationMode } from "../types";
import { getEnv } from "../env";
import { decodeAccountId } from "./accountId";
import { getAllDerivationModes } from "../derivation";
import { isCurrencySupported } from "../currencies";

export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
) =>
  derivationMode === ""
    ? !!getEnv("SHOW_LEGACY_NEW_ACCOUNT") || !currency.supportsSegwit
    : derivationMode === "segwit" || derivationMode === "native_segwit";

export function canBeMigrated(account: Account) {
  const { type } = decodeAccountId(account.id);
  // at the moment migrations requires experimental libcore
  if (!getEnv("EXPERIMENTAL_LIBCORE")) return false;
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

  const { type } = decodeAccountId(account.id);
  if (
    type === "libcore" &&
    account.currency.family === "ethereum" &&
    !getEnv("EXPERIMENTAL_EXPLORERS")
  ) {
    return new AccountNotSupported("experimental explorer required", {
      reason: "require Experimental Nodes"
    });
  }
}
