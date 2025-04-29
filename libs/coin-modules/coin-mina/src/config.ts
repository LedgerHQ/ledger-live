import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type MinaCoinConfig = () => CurrencyConfig & {
  infra: {
    API_MINA_ROSETTA_NODE: string;
  };
};

let coinConfig: MinaCoinConfig | undefined;

export const setCoinConfig = (config: MinaCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<MinaCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Mina module config not set");
  }

  return coinConfig();
};
