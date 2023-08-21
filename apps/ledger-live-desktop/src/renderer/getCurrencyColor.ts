import { useMemo } from "react";
import { getCurrencyColor as commonGetCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { Currency } from "@ledgerhq/types-cryptoassets";
import ensureContrast from "~/renderer/ensureContrast";
export const getCurrencyColor = (currency: Currency, bg?: string | null) => {
  const currencyColor = commonGetCurrencyColor(currency);
  return bg ? ensureContrast(currencyColor, bg) : currencyColor;
};
export const useCurrencyColor = (currency: Currency, bg?: string | null) => {
  return useMemo(() => {
    const currencyColor = commonGetCurrencyColor(currency);
    return bg ? ensureContrast(currencyColor, bg) : currencyColor;
  }, [currency, bg]);
};
