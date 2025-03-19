import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useState, useCallback } from "react";

export type SupportedChainsViewModelResult = {
  currencies: CryptoCurrency[];
  notSupported: CryptoCurrency[];
  visible: boolean;
  total: number;
  handleChange: (currency: CryptoCurrency, included: boolean) => void;
  isIncluded: (currency: CryptoCurrency) => boolean;
};

export const NOT_SUPPORTED = ["solana", "base", "arbitrum", "optimism"];

export const useSupportedChainsViewModel = (): SupportedChainsViewModelResult => {
  const { supportedCurrencies, unsupportedCurrencies } = getEnv("NFT_CURRENCIES").reduce<{
    supportedCurrencies: string[];
    unsupportedCurrencies: string[];
  }>(
    (acc, currency) => {
      if (NOT_SUPPORTED.includes(currency)) {
        acc.unsupportedCurrencies.push(currency);
      } else {
        acc.supportedCurrencies.push(currency);
      }
      return acc;
    },
    { supportedCurrencies: [], unsupportedCurrencies: [] },
  );

  const [overhiddenCurrencies, setOverhiddenCurrencies] = useState<string[]>(unsupportedCurrencies);
  const currencies = supportedCurrencies.map(getCryptoCurrencyById);
  const notSupported = NOT_SUPPORTED.map(getCryptoCurrencyById);

  const visible = currencies.length > 0;

  const handleChange = useCallback(
    (currency: CryptoCurrency, included: boolean) => {
      const newTab = included
        ? overhiddenCurrencies.filter(c => c !== currency.id)
        : [...overhiddenCurrencies, currency.id];
      setOverhiddenCurrencies(newTab);
      const setUniques = new Set(supportedCurrencies.concat(newTab));
      setEnvUnsafe("NFT_CURRENCIES", [...setUniques].join(","));
    },
    [overhiddenCurrencies, supportedCurrencies],
  );

  const total = supportedCurrencies.length + overhiddenCurrencies.length;
  const isIncluded = (currency: CryptoCurrency) => overhiddenCurrencies.includes(currency.id);

  return {
    currencies,
    notSupported,
    visible,
    total,
    isIncluded,
    handleChange,
  };
};
