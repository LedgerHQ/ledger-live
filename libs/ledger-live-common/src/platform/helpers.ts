import { isCryptoCurrency, isTokenCurrency } from "../currencies";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Currency } from "@domain/entity-currency";
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
  currency: Currency,
): currency is PlatformSupportedCurrency {
  if (isCryptoCurrency(currency)) {
    return includes(PLATFORM_FAMILIES, currency.family);
  }
  if (isTokenCurrency(currency)) {
    return includes(PLATFORM_FAMILIES, getCryptoCurrencyById(currency.parentCurrencyId).family);
  }
  return false;
}

export function isPlatformCryptoCurrency(
  currency: PlatformCurrency,
): currency is PlatformCryptoCurrency {
  return currency.type === PlatformCurrencyType.CryptoCurrency;
}

export function isPlatformERC20TokenCurrency(
  currency: PlatformCurrency,
): currency is PlatformERC20TokenCurrency {
  return (currency as PlatformERC20TokenCurrency).standard === "ERC20";
}
