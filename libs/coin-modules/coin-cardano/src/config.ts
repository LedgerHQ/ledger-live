import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type CardanoConfig = {
  /** Selects the Alpaca network id; the bridge selects it by currency id. */
  testnet: boolean;
  api: { url: string };
  epochParams: { url: string };
  /** A bridge fee above it, in lovelace, warns. */
  maxFeesWarning: number;
  /** A bridge fee above it, in lovelace, fails. */
  maxFeesError: number;
  fees: {
    /** Alpaca warns when the fee exceeds 1/ratio of the amount. */
    tooHighRatio: number;
  };
  staking?: {
    /** Pool ids shown as Ledger pools. Without it, the module's `LEDGER_VALIDATORS`. */
    ledgerValidators?: string[];
  };
  validators: {
    /** Pools per pool-list request. */
    batchSize: number;
  };
};

export type CardanoCoinConfig = CurrencyConfig & CardanoConfig;

/** The {@link Context} the bridge and the Alpaca API receive (ADR-019). */
export type CardanoContext = Context<CardanoCoinConfig>;

/**
 * Pins `context` to one resolved `config`, whatever currency id a consumer asks for.
 *
 * Use it where one operation must see a single configuration.
 */
export const pinConfig = (context: CardanoContext, config: CardanoCoinConfig): CardanoContext => ({
  ...context,
  config: () => Promise.resolve(config),
});

const tuning = {
  maxFeesWarning: 5e6,
  maxFeesError: 10e6,
  fees: { tooHighRatio: 10 },
  validators: { batchSize: 100 },
};

export const cardanoDefaults = {
  cardano: {
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Cardano",
    unit: { name: "ada", code: "ADA", magnitude: 6 },
    ...tuning,
    testnet: false,
    api: { url: "https://cardano.coin.ledger.com/api" },
    epochParams: { url: "https://ada.api.live.ledger.com/api/rest/params" },
  },
  cardano_testnet: {
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Cardano (Testnet)",
    unit: { name: "ada", code: "tADA", magnitude: 6 },
    ...tuning,
    testnet: true,
    api: { url: "https://ledger-preprod.cardanoscan.io/api" },
    epochParams: { url: "https://ada-testnet.api.live.ledger-test.com/api/rest/params" },
  },
} satisfies Record<string, CardanoCoinConfig>;
