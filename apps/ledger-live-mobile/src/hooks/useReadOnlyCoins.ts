import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";

export const useReadOnlyCoins = ({ maxDisplayed }: { maxDisplayed: number }) => {
  const cryptoCurrenciesReadOnly = [
    "bitcoin",
    "ethereum",
    "bsc",
    "ripple",
    "solana",
    "dogecoin",
    "tron",
    "cardano",
    "avalanche_c_chain",
    "stellar",
  ];

  const cryptoCurrencies = cryptoCurrenciesReadOnly.map(currency =>
    getCryptoCurrencyById(currency),
  );

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies).slice(0, maxDisplayed);

  return { sortedCryptoCurrencies };
};
