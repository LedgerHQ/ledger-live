import { EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";

type GasTrackerConfig = EthereumLikeInfo["gasTracker"];

/**
 * Type guard
 */
export const isLedgerGasTracker = (
  gasTrackerConfig: GasTrackerConfig,
): gasTrackerConfig is GasTrackerConfig & { type: "ledger" } => {
  return gasTrackerConfig?.type === "ledger";
};
