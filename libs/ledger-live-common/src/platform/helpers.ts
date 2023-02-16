import { isCryptoCurrency, isTokenCurrency } from "../currencies";
import { Currency } from "@ledgerhq/types-cryptoassets";
import {
  PlatformCurrency,
  PlatformSupportedCurrency,
  PlatformERC20TokenCurrency,
  PlatformCryptoCurrency,
  PlatformCurrencyType,
  PLATFORM_FAMILIES,
} from "./types";
import { includes } from "../helpers";

export function isPlatformSupportedCurrency(
  currency: Currency
): currency is PlatformSupportedCurrency {
  if (isCryptoCurrency(currency)) {
    return includes(PLATFORM_FAMILIES, currency.family);
  }
  if (isTokenCurrency(currency)) {
    return includes(PLATFORM_FAMILIES, currency.parentCurrency.family);
  }
  return false;
}

export function isPlatformCryptoCurrency(
  currency: PlatformCurrency
): currency is PlatformCryptoCurrency {
  return currency.type === PlatformCurrencyType.CryptoCurrency;
}

export function isPlatformTokenCurrency(
  currency: PlatformCurrency
): currency is PlatformERC20TokenCurrency {
  return currency.type === PlatformCurrencyType.TokenCurrency;
}

export function isPlatformERC20TokenCurrency(
  currency: PlatformCurrency
): currency is PlatformERC20TokenCurrency {
  return (currency as PlatformERC20TokenCurrency).standard === "ERC20";
}
