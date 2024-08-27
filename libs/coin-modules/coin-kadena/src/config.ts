import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type KadenaCoinConfig = () => CurrencyConfig & {
  infra: {
    API_KADENA_ENDPOINT: string;
  };
};

let coinConfig: KadenaCoinConfig | undefined;

export const setCoinConfig = (config: KadenaCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<KadenaCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Kadena module config not set");
  }

  return coinConfig();
};
