import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import type { CosmosCoinConfig } from "../../config";
import { getEstimatedFees } from "../../prepareTransaction";
import { intentToMessageParams } from "./intentAdapter";

/**
 * Estimate fees by simulating on the node; the simulated gas limit is carried in
 * `parameters.gasLimit` so `craftTransaction` reuses it without re-simulating.
 */
export async function estimateFees(
  config: CosmosCoinConfig,
  currencyId: string,
  intent: TransactionIntent,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const params = intentToMessageParams(intent, currencyId, config.denom);

  const { gasWanted, gasWantedFees } = await getEstimatedFees(config, params);

  return {
    value: BigInt(gasWantedFees.toFixed()),
    parameters: { gasLimit: gasWanted.toFixed() },
  };
}
