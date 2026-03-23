import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type MinaCoinConfig = () => CurrencyConfig & {
  infra: {
    API_VALIDATORS_BASE_URL: string;
    API_MINA_ROSETTA_NODE: string;
    API_MINA_GRAPHQL_NODE: string;
  };
};

let coinConfig: MinaCoinConfig | undefined;

export const setCoinConfig = (config: MinaCoinConfig): void => {
  coinConfig = config;
};

/** Clears in-memory config. For unit tests only; do not use in app code. */
export const resetCoinConfigForTesting = (): void => {
  coinConfig = undefined;
};

export const getCoinConfig = (): ReturnType<MinaCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Mina module config not set");
  }

  return coinConfig();
};
