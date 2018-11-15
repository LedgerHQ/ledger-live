// @flow
import type {
  CryptoCurrencyIds,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { getFullListSortedCryptoCurrenciesSync } from "./countervalues";

const supported: CryptoCurrencyIds[] = [
  "bitcoin",
  "ethereum",
  "ripple",
  "bitcoin_cash",
  "litecoin",
  "dash",
  "ethereum_classic",
  "qtum",
  "zcash",
  "bitcoin_gold",
  "stratis",
  "dogecoin",
  "digibyte",
  "hcash",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stealthcoin",
  "poswallet",
  "clubcoin",
  "bitcoin_testnet",
];

export const listCryptoCurrencies = (withDevCrypto?: boolean) =>
  getFullListSortedCryptoCurrenciesSync().filter(
    c => supported.includes(c.id) && (withDevCrypto || !c.isTestnetFor),
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
