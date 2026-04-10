import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { KnownJetton } from "./types";

export type TonCoinConfig = () => CurrencyConfig & {
  infra: {
    API_TON_ENDPOINT: string;
    KNOWN_JETTONS: KnownJetton[];
  };
};

declare global {
  var __ledgerCoinConfig_ton: TonCoinConfig | undefined;
}

export const setCoinConfig = (config: TonCoinConfig): void => {
  globalThis.__ledgerCoinConfig_ton = config;
};

export const getCoinConfig = (): ReturnType<TonCoinConfig> => {
  if (!globalThis.__ledgerCoinConfig_ton?.()) {
    throw new Error("Ton module config not set");
  }

  return globalThis.__ledgerCoinConfig_ton();
};
