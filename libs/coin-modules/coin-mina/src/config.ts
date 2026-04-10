import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type MinaCoinConfig = () => CurrencyConfig & {
  infra: {
    API_MINA_ROSETTA_NODE: string;
  };
};

declare global {
  var __ledgerCoinConfig_mina: MinaCoinConfig | undefined;
}

export const setCoinConfig = (config: MinaCoinConfig): void => {
  globalThis.__ledgerCoinConfig_mina = config;
};

export const getCoinConfig = (): ReturnType<MinaCoinConfig> => {
  if (!globalThis.__ledgerCoinConfig_mina?.()) {
    throw new Error("Mina module config not set");
  }

  return globalThis.__ledgerCoinConfig_mina();
};
