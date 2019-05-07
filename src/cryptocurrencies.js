// @flow
import type {
  CryptoCurrencyIds,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { getFullListSortedCryptoCurrenciesSync } from "./countervalues";

const supported: CryptoCurrencyIds[] = [
  "bitcoin_cash",
  "bitcoin_gold",
  "bitcoin_testnet",
  "bitcoin",
  "clubcoin",
  "dash",
  "decred",
  "digibyte",
  "dogecoin",
  "ethereum_classic",
  "ethereum",
  "hcash",
  "komodo",
  "litecoin",
  "peercoin",
  "pivx",
  "poswallet",
  "qtum",
  "ripple",
  "stealthcoin",
  "stratis",
  "vertcoin",
  "viacoin",
  "stakenet",
  "zcash",
  "zencash",
];

export const listCryptoCurrencies = (
  withDevCrypto?: boolean,
): CryptoCurrency[] =>
  getFullListSortedCryptoCurrenciesSync().filter(
    c => supported.includes(c.id) && (withDevCrypto || !c.isTestnetFor),
  );

export const supportsExistingAccount = ({
  currencyId,
}: {
  currencyId: string,
}) => listCryptoCurrencies(true).some(c => c.id === currencyId);

// TODO move to live-common with a new env
const SHOW_LEGACY_NEW_ACCOUNT = false;

export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
) =>
  derivationMode === ""
    ? !!SHOW_LEGACY_NEW_ACCOUNT || !currency.supportsSegwit
    : derivationMode === "segwit";
