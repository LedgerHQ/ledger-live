import {
  AccountNotSupported,
  CurrencyNotSupported,
  UnavailableTezosOriginatedAccountReceive,
} from "@ledgerhq/errors";
import { getEnv } from "../env";
import { decodeAccountId } from "./accountId";
import {
  getAllDerivationModes,
  getDerivationModesForCurrency,
} from "../derivation";
import { isCurrencySupported } from "../currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { DerivationMode } from "../derivation";

export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
): boolean => {
  const modes = getDerivationModesForCurrency(currency);
  // last mode is always creatable by convention
  if (modes[modes.length - 1] === derivationMode) return true;
  // legacy is only available with flag SHOW_LEGACY_NEW_ACCOUNT
  if (
    derivationMode === "" &&
    (!!getEnv("SHOW_LEGACY_NEW_ACCOUNT") || currency.family === "bitcoin")
  )
    return true;
  // native segwit being not yet supported everywhere, segwit is always available for creation
  if (
    derivationMode === "segwit" ||
    (currency.family === "bitcoin" &&
      (derivationMode === "native_segwit" || derivationMode === "taproot"))
  )
    return true;
  return false;
};
export const getReceiveFlowError = (
  account: AccountLike,
  parentAccount: Account | null | undefined
): Error | null | undefined => {
  if (parentAccount && parentAccount.currency.id === "tezos") {
    return new UnavailableTezosOriginatedAccountReceive("");
  }
};
export function canBeMigrated(account: Account): boolean {
  try {
    const { version } = decodeAccountId(account.id);

    if (getEnv("MOCK")) {
      return version === "0";
    }

    return false;
  } catch (e) {
    return false;
  }
}
// attempt to find an account in scanned accounts that satisfy a migration
export function findAccountMigration(
  account: Account,
  scannedAccounts: Account[]
): Account | null | undefined {
  if (!canBeMigrated(account)) return;

  if (getEnv("MOCK")) {
    return scannedAccounts.find(
      (a) =>
        a.id !== account.id && // a migration assume an id changes
        a.currency === account.currency &&
        a.freshAddress === account.freshAddress
    );
  }
}
export function checkAccountSupported(
  account: Account
): Error | null | undefined {
  if (
    !getAllDerivationModes().includes(account.derivationMode as DerivationMode)
  ) {
    return new AccountNotSupported(
      "derivation not supported " + account.derivationMode,
      {
        reason: account.derivationMode,
      }
    );
  }

  if (!isCurrencySupported(account.currency)) {
    const currencyName = account.currency.name;
    return new CurrencyNotSupported("currency not supported: " + currencyName, {
      currencyName,
    });
  }
}
