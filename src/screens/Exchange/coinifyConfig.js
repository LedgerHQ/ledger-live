// @flow
import Config from "react-native-config";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types/currencies";

export const supportedCurrenciesIds = [
  "bitcoin",
  "ethereum",
  "bitcoin_cash",
  "dash",
];

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

export const isCurrencySupported = (currency: TokenCurrency | CryptoCurrency) =>
  supportedCurrenciesIds.includes(currency.id);

export const getConfig = () =>
  Config.COINIFY_SANDBOX ? config.sandbox : config.production;
