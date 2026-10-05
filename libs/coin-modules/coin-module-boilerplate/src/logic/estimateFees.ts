import { type BoilerplateCoinConfig, DEFAULT_FALLBACK_FEE } from "../config";
import { simulate } from "../network/node";
import { SimulationError } from "../types/errors";

export async function estimateFees(
  config: BoilerplateCoinConfig,
  serializedTransaction: string,
): Promise<bigint> {
  try {
    // We call the node to do a dry run and estimate fees
    return BigInt(await simulate(config, serializedTransaction));
  } catch (e) {
    // default value is required in case of simulation error, else user will encounter an error in the flow
    if (e instanceof SimulationError) {
      return BigInt(config.fees?.fallbackFee ?? DEFAULT_FALLBACK_FEE);
    } else {
      throw new Error("Unexpected error while estimating fees.");
    }
  }
}
