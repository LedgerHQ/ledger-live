import BigNumber from "bignumber.js";
import { simulate } from "../../network/node";
import { SimulationError } from "../../types/errors";
import { Fees, Intent } from "@ledgerhq/coin-framework/lib/api/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function estimateFees(intents: Intent): Promise<Fees> {
  const fees: Fees = {
    standard: BigInt(0),
  };
  try {
    // We call the node to do a dry run and estimate fees
    fees.standard = BigInt((await simulate()).toString());
  } catch (e) {
    // default value is required in case of simulation error, else user will encounter an error in the flow
    if (e instanceof SimulationError) {
      fees.standard = BigInt(1000);
    } else {
      throw new Error("Unexpected error while estimating fees.");
    }
  }
  return fees;
}
