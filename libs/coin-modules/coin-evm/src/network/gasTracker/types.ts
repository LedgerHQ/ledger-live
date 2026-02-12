import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmConfigInfo } from "../../config";
import { GasOptions } from "../../types";

export type GasTrackerApi = {
  getGasOptions: ({
    currency,
    options,
  }: {
    currency: CryptoCurrency;
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
