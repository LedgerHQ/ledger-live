// @flow
import Config from "react-native-config";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types/currencies";

const supportedCurrenciesIds = {
  buy: [
    "bitcoin",
    "ethereum",
    "bitcoin_cash",
    "dash",
    "stellar",
    "ethereum/erc20/usd_tether__erc20_",
  ],
  sell: ["bitcoin"],
};

export const getSupportedCurrencies = (mode: "buy" | "sell" = "buy") =>
  supportedCurrenciesIds[mode];

const config = {
  sandbox: {
    url: "https://trade-ui.sandbox.coinify.com/widget",
    partnerId: 104,
  },
  production: {
    url: "https://trade-ui.coinify.com/widget",
    partnerId: 119,
  },
};

export const isCurrencySupported = (
  currency: TokenCurrency | CryptoCurrency,
  mode: "buy" | "sell" = "buy",
) => supportedCurrenciesIds[mode].includes(currency.id);

export const getConfig = () =>
  Config.COINIFY_SANDBOX ? config.sandbox : config.production;
