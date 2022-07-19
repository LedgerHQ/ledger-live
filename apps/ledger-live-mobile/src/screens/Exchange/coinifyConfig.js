// @flow
import Config from "react-native-config";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/types/currencies";

const supportedCurrenciesIds = {
  buy: [
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
  ],
  sell: ["bitcoin"],
};

export const getSupportedCurrencies = (mode: "buy" | "sell" = "buy") =>
  supportedCurrenciesIds[mode];

const config = {
  sandbox: {
    url: "https://trade-ui.sandbox.coinify.com/widget",
    partnerId: "191f0c7f-076d-459f-bf2d-833465bfadc2",
  },
  production: {
    url: "https://trade-ui.coinify.com/widget",
    partnerId: "191f0c7f-076d-459f-bf2d-833465bfadc2",
  },
};

export const isCurrencySupported = (
  currency: TokenCurrency | CryptoCurrency,
  mode: "buy" | "sell" = "buy",
) => supportedCurrenciesIds[mode].includes(currency.id);

export const getConfig = () =>
  Config.COINIFY_SANDBOX ? config.sandbox : config.production;
