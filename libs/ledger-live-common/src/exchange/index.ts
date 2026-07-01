import { valid, gte } from "semver";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import calService from "@ledgerhq/ledger-cal-service";
// Minimum version of a currency app which has exchange capabilities, meaning it can be used
// for sell/swap, and do silent signing.
const exchangeSupportAppVersions = {
  bitcoin_cash: "1.5.0",
  bitcoin_gold: "1.5.0",
  bitcoin: "1.5.0",
  dash: "1.5.0",
  digibyte: "1.5.0",
  dogecoin: "1.5.0",
  ethereum: "1.4.0",
  litecoin: "1.5.0",
  polkadot: "24.9430.3",
  qtum: "1.5.0",
  ripple: "2.1.0",
  solana: "1.4.0",
  stellar: "3.3.0",
  tezos: "2.2.13",
  tron: "0.4.100",
  zcash: "1.5.0",
  zencash: "1.5.0",
  sui: "1.2.0",
};

type ExchangeCurrencyNameAndSignature = {
  config: Buffer;
  signature: Buffer;
};

export const isExchangeSupportedByApp = (appName: string, appVersion: string): boolean => {
  const minVersion = exchangeSupportAppVersions[appName];
  return !!(valid(minVersion) && valid(appVersion) && gte(appVersion, minVersion));
};

const ARC_NATIVE_USDC_TOKEN_ID_BY_CURRENCY_ID: Record<string, string> = {
  arc: "arc/erc20/usdc_0x0000000000000000000000000000000000000000",
  arc_testnet: "arc_testnet/erc20/usdc_0x3600000000000000000000000000000000000000",
};

export const getCurrencyExchangeConfig = async (
  currency: CryptoCurrency | TokenCurrency,
): Promise<ExchangeCurrencyNameAndSignature> => {
  const env = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
  const lookupId = ARC_NATIVE_USDC_TOKEN_ID_BY_CURRENCY_ID[currency.id] ?? currency.id;
  const res = await calService.findCurrencyData(lookupId, { env });

  if (!res) {
    throw new Error(`Exchange, missing configuration for ${lookupId}`);
  }

  return {
    config: Buffer.from(res.config, "hex"),
    signature: Buffer.from(res.signature, "hex"),
  };
};
