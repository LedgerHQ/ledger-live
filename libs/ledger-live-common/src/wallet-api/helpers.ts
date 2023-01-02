import { isCryptoCurrency, isTokenCurrency } from "../currencies";
import { Currency } from "@ledgerhq/types-cryptoassets";
import {
  WalletAPICurrency,
  WalletAPISupportedCurrency,
  WalletAPIERC20TokenCurrency,
  WalletAPICryptoCurrency,
} from "./types";

export function isWalletAPISupportedCurrency(
  currency: Currency
): currency is WalletAPISupportedCurrency {
  return isCryptoCurrency(currency) || isTokenCurrency(currency);
}

export function isWalletAPICryptoCurrency(
  currency: WalletAPICurrency
): currency is WalletAPICryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isWalletAPITokenCurrency(
  currency: WalletAPICurrency
): currency is WalletAPIERC20TokenCurrency {
  return currency.type === "TokenCurrency";
}

export function isWalletAPIERC20TokenCurrency(
  currency: WalletAPICurrency
): currency is WalletAPIERC20TokenCurrency {
  return (currency as WalletAPIERC20TokenCurrency).standard === "ERC20";
}
