// @flow
import type {
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { isCurrencySupported } from "@ledgerhq/live-common/lib/currencies";
import { getFullListSortedCryptoCurrenciesSync } from "./countervalues";

// TODO move to use live-common functions
export const listCryptoCurrencies = (
  withDevCrypto?: boolean,
): CryptoCurrency[] =>
  getFullListSortedCryptoCurrenciesSync().filter(
    c => isCurrencySupported(c) && (withDevCrypto || !c.isTestnetFor),
  );

export const supportsExistingAccount = ({
  currencyId,
}: {
  currencyId: string,
}) => listCryptoCurrencies(true).some(c => c.id === currencyId);

const SHOW_LEGACY_NEW_ACCOUNT = false;

export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
) =>
  derivationMode === ""
    ? !!SHOW_LEGACY_NEW_ACCOUNT || !currency.supportsSegwit
    : derivationMode === "segwit";
