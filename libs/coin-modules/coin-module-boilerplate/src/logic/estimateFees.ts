import { simulate } from "../network/node";
import { SimulationError } from "../types/errors";
import type { BoilerplateCoinConfig } from "../config";

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
      return BigInt(1000);
    } else {
      throw new Error("Unexpected error while estimating fees.");
    }
  }
}
