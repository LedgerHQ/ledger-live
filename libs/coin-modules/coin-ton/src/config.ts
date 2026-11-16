import { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { KNOWN_JETTONS } from "@ton-community/ton-ledger";
import { KnownJetton } from "./types";

export type TonConfig = CurrencyConfig & {
  infra: {
    API_TON_ENDPOINT: string;
    KNOWN_JETTONS: KnownJetton[];
  };
};

/** The {@link Context} threaded through the coin-ton low layers (ADR-019). */
export type TonContext = Context<TonConfig>;

export type TonCoinConfig = () => TonConfig;

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

export const tonDefaults = {
  ton: {
    status: {
      type: "active",
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    name: "Gram",
    unit: { name: "GRAM", code: "GRAM", magnitude: 9 },
    infra: {
      API_TON_ENDPOINT: "https://ton.coin.ledger.com/api/v3",
      KNOWN_JETTONS,
    },
  },
} satisfies Record<string, TonConfig>;
