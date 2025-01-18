import BigNumber from "bignumber.js";
import { simulate } from "../../network/node";
import { SimulationError } from "../../types/errors";

export async function estimateFees(serializedTx: string): Promise<BigNumber> {
  let fees;
  try {
    // We call the node to do a dry run and estimate fees
    fees = await simulate(serializedTx);
  } catch (e) {
    // default value is required in case of simulation error, else user will encounter an error in the flow
    if (e instanceof SimulationError) {
      fees = new BigNumber(1000);
    } else {
      throw new Error("Unexpected error while estimating fees.");
    }
  }
  return new BigNumber(fees);
}
