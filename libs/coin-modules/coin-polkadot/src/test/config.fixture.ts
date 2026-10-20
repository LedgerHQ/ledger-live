import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { PolkadotCoinConfig, PolkadotContext } from "../config";

/** A resolved Polkadot config for tests. */
export const polkadotMainnetConfigValue: PolkadotCoinConfig = {
  status: { type: "active" },
  name: "Polkadot",
  unit: { name: "DOT", code: "DOT", magnitude: 10 },
  node: { url: "https://polkadot.mock/node" },
  sidecar: { url: "https://polkadot.mock/sidecar" },
  indexer: { url: "https://polkadot.mock/indexer" },
};

/** A resolved Polkadot config with the staking feature enabled, for tests. */
export const polkadotStakingConfigValue: PolkadotCoinConfig = {
  ...polkadotMainnetConfigValue,
  status: {
    type: "active",
    features: [
      { id: "blockchain_txs", status: "active" },
      { id: "staking_txs", status: "active" },
    ],
  },
};

/** A {@link PolkadotContext} backed by the mainnet fixture, for api/logic tests. */
export const createMockPolkadotContext = (
  config: PolkadotCoinConfig = polkadotMainnetConfigValue,
  logger: Logger = () => {},
): PolkadotContext => ({
  config: async () => config,
  logger,
});
