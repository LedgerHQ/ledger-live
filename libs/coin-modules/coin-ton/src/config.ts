import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type TonCoinConfig = () => CurrencyConfig & {
  infra: {
    API_TON_ENDPOINT: string;
  };
};

let coinConfig: TonCoinConfig | undefined;

export const setCoinConfig = (config: TonCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (): ReturnType<TonCoinConfig> => {
  if (!coinConfig?.()) {
    throw new Error("Ton module config not set");
  }

  return coinConfig();
};
