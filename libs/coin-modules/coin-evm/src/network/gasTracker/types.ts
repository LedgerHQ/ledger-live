import { EvmConfigInfo } from "../../config";
import { GasOptions } from "../../types";

export type GasTrackerApi = {
  getGasOptions: ({
    currencyId,
    config,
    options,
  }: {
    currencyId: string;
    config: EvmConfigInfo;
    options?: {
      useEIP1559: boolean;
    };
  }) => Promise<GasOptions>;
};

type GasTrackerConfig = EvmConfigInfo["gasTracker"];

/**
 * Type guard
 */
export const isLedgerGasTracker = (
  gasTrackerConfig: GasTrackerConfig,
): gasTrackerConfig is GasTrackerConfig & { type: "ledger" } => {
  return gasTrackerConfig?.type === "ledger";
};
