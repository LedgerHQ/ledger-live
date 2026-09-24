import type { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { celoConfig as coinCeloConfig } from "@ledgerhq/coin-celo/config";

export * from "@ledgerhq/coin-celo/config";

const { config_currency_celo: coinCeloCurrency } = coinCeloConfig;

export const celoConfig: Record<string, ConfigInfo> = {
  config_currency_celo: {
    type: "object",
    default: {
      ...(coinCeloCurrency.type === "object" ? coinCeloCurrency.default : {}),
      infra: {
        API_CELO_INDEXER: "https://celo.coin.ledger.com/indexer/",
      },
    },
  },
};
