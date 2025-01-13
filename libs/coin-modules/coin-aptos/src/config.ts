import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getEnv } from "@ledgerhq/live-env";
import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type AptosConfig = {
  node: {
    fullnode: string;
    indexer: string;
  };
};

export const family = "aptos";

const isTestnet = (currencyId: string): boolean => !!getCryptoCurrencyById(currencyId).isTestnetFor;

export const getApiEndpoint = (currencyId: string) =>
  isTestnet(currencyId) ? getEnv("APTOS_TESTNET_API_ENDPOINT") : getEnv("APTOS_API_ENDPOINT");

export const getIndexerEndpoint = (currencyId: string) =>
  isTestnet(currencyId)
    ? getEnv("APTOS_TESTNET_INDEXER_ENDPOINT")
    : getEnv("APTOS_INDEXER_ENDPOINT");

export const aptosCoinConfig: AptosCoinConfig = {
  status: {
    type: "active",
  },
  node: {
    fullnode: getApiEndpoint(family),
    indexer: getIndexerEndpoint(family),
  },
};

export type AptosCoinConfig = CurrencyConfig & AptosConfig;

const coinConfig = buildConConfig<AptosCoinConfig>();

export default coinConfig;
