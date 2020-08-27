// @flow

import type {
  SwapCurrencyNameAndSignature,
  SwapProviderNameAndSignature,
} from "./types";
import type { CryptoCurrency, TokenCurrency } from "../types/currencies";
import exchangeCurrencyConfigs from "../load/exchange";
import getExchangeRates from "./getExchangeRates";
import getStatus from "./getStatus";
import getProviders from "./getProviders";
import getCompleteSwapHistory from "./getCompleteSwapHistory";
import initSwap from "./initSwap";

const swapAPIBaseURL = "https://swap.staging.aws.ledger.fr";

const swapProviders: {
  [string]: { nameAndPubkey: Buffer, signature: Buffer },
} = {
  changelly: {
    nameAndPubkey: Buffer.from(
      "094368616e67656c6c790480d7c0d3a9183597395f58dda05999328da6f18fabd5cda0aff8e8e3fc633436a2dbf48ecb23d40df7c3c7d3e774b77b4b5df0e9f7e08cf1cdf2dba788eb085b",
      "hex"
    ),
    signature: Buffer.from(
      "30440220554dd6dc172ba5bd20a1bbf60845bbcac67aa0d8d115e55679e2838b772aef41022070f7a3cda142371518ebf16f9696cb27640832ef9401d88209a9e988aab4b3ff",
      "hex"
    ),
  },
};

const getCurrencySwapConfig = (
  currency: CryptoCurrency | TokenCurrency
): SwapCurrencyNameAndSignature => {
  const res = exchangeCurrencyConfigs[currency.id];
  if (!res) {
    throw new Error(`Swap, missing configuration for ${currency.id}`);
  }
  return {
    config: Buffer.from(res.config, "hex"),
    signature: Buffer.from(res.signature, "hex"),
  };
};

const getProviderNameAndSignature = (
  providerName: string
): SwapProviderNameAndSignature => {
  const res = swapProviders[providerName];
  if (!res) {
    throw new Error(`Unknown partner ${providerName}`);
  }
  return res;
};

const isCurrencySwapSupported = (
  currency: CryptoCurrency | TokenCurrency
): boolean => {
  return !!exchangeCurrencyConfigs[currency.id];
};

export {
  swapAPIBaseURL,
  getProviderNameAndSignature,
  getProviders,
  getStatus,
  getCurrencySwapConfig,
  getExchangeRates,
  getCompleteSwapHistory,
  isCurrencySwapSupported,
  initSwap,
};
