import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";
import { getEstimatedFees } from "../../prepareTransaction";
import { intentToMessageParams } from "./intentAdapter";

/**
 * Estimate fees by simulating on the node; the simulated gas limit is carried in
 * `parameters.gasLimit` so `craftTransaction` reuses it without re-simulating.
 */
export async function estimateFees(
  api: CosmosAPI,
  intent: TransactionIntent,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const currency = api.getCurrency();
  const params = intentToMessageParams(intent, currency.id, currency.units[1].code);

  const { gasWanted, gasWantedFees } = await getEstimatedFees(params);

  return {
    value: BigInt(gasWantedFees.toFixed()),
    parameters: { gasLimit: gasWanted.toFixed() },
  };
}
