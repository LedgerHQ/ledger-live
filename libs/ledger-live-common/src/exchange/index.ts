import { valid, gte } from "semver";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getEnv } from "@shared/env";
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

// ---- LOCAL PLAYGROUND ONLY — DO NOT COMMIT ----
// Overrides CAL's descriptor_exchange_app for the Aleo tokens so the sub coin config carries
// [len][ticker][decimals] instead of being empty. Signatures are made with app-exchange's
// LEDGER_TEST_PRIVATE_KEY, so they only verify on an app built with TEST_PUBLIC_KEY=1.
const LOCAL_ALEO_OVERRIDES: Record<string, { config: string; signature: string }> = {
  "aleo/arc22/usad": {
    config: "045553414404416c656f06045553414406",
    signature:
      "3043021f59e13752beb472c864b0ba44cca7fb16dd7c3abeba7d4c58ad443e2699d70e02200d0ab7029501328cf6e4c3c8cf7217b8ea643fdedc59116f2f01f3b2bde36153",
  },
  "aleo/arc22/usdcx": {
    config: "05555344437804416c656f0705555344437806",
    signature:
      "30440220371534bbdd4c0ab4824f9257f1f171ea256329bacfb7167da6c507b7d8c3e204022019d3bf1fb0b0d310e3b4a489505d7971edb5dce28763dc01a66ba2d560fecabf",
  },
};
// ---- /LOCAL PLAYGROUND ----

export const getCurrencyExchangeConfig = async (
  currency: CryptoCurrency | TokenCurrency,
): Promise<ExchangeCurrencyNameAndSignature> => {
  // LOCAL PLAYGROUND ONLY — DO NOT COMMIT
  const override = LOCAL_ALEO_OVERRIDES[currency.id];
  if (override) {
    return {
      config: Buffer.from(override.config, "hex"),
      signature: Buffer.from(override.signature, "hex"),
    };
  }

  // LOCAL PLAYGROUND ONLY — DO NOT COMMIT: signatureKind was left at its "prod" default, which a
  // TEST_PUBLIC_KEY build rejects for every non-overridden currency.
  const env = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
  const lookupId = ARC_NATIVE_USDC_TOKEN_ID_BY_CURRENCY_ID[currency.id] ?? currency.id;
  const res = await calService.findCurrencyData(lookupId, { env, signatureKind: env });

  if (!res) {
    throw new Error(`Exchange, missing configuration for ${lookupId}`);
  }

  return {
    config: Buffer.from(res.config, "hex"),
    signature: Buffer.from(res.signature, "hex"),
  };
};
