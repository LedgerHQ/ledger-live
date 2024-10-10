import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
export const supportedBuyCurrenciesIds = [
  "bitcoin",
  "ethereum",
  "polkadot",
  "litecoin",
  "dogecoin",
  "bitcoin_cash",
  "stellar",
  "ethereum/erc20/usd_tether__erc20_",
  "ethereum/erc20/celsius",
  "ethereum/erc20/compound",
  "ethereum/erc20/makerdao",
  "ethereum/erc20/uniswap",
  "ethereum/erc20/link_chainlink",
];
export const supportedSellCurrenciesIds = ["bitcoin"];
export const isCurrencySupported = (
  mode: "BUY" | "SELL",
  currency: TokenCurrency | CryptoCurrency,
) => {
  if (mode === "BUY") {
    return supportedBuyCurrenciesIds.includes(currency.id);
  }
  return supportedSellCurrenciesIds.includes(currency.id);
};
