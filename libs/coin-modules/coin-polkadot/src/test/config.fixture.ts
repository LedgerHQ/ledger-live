import type { PolkadotCoinConfig, PolkadotContext } from "../config";

/** A resolved Polkadot config for tests. */
export const polkadotMainnetConfigValue: PolkadotCoinConfig = {
  status: { type: "active" },
  node: { url: "https://polkadot.mock/node" },
  sidecar: { url: "https://polkadot.mock/sidecar" },
  indexer: { url: "https://polkadot.mock/indexer" },
};

/** A {@link PolkadotContext} backed by the mainnet fixture, for api/logic tests. */
export const createMockPolkadotContext = (
  config: PolkadotCoinConfig = polkadotMainnetConfigValue,
): PolkadotContext => ({
  config: async () => config,
  logger: () => {},
});
