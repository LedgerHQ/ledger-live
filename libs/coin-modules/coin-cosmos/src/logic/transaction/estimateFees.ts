import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { getEstimatedFees } from "../../prepareTransaction";
import { CosmosAccount } from "../../types";
import { intentToAccount, intentToTransaction } from "./intentAdapter";

/**
 * Estimate fees by simulating on the node; the simulated gas limit is carried in
 * `parameters.gasLimit` so `craftTransaction` reuses it without re-simulating.
 */
export async function estimateFees(
  currencyId: string,
  intent: TransactionIntent,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const account = intentToAccount(intent, currencyId) as CosmosAccount;
  const transaction = intentToTransaction(intent);

  const { gasWanted, gasWantedFees } = await getEstimatedFees(account, transaction);

  return {
    value: BigInt(gasWantedFees.toFixed()),
    parameters: { gasLimit: gasWanted.toFixed() },
  };
}
