import { simulate } from "../../network/node";
import { BoilerplateToken } from "../../types";
import { SimulationError } from "../../types/errors";
import { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";

export async function estimateFees(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transactionIntent: TransactionIntent<BoilerplateToken>,
): Promise<bigint> {
  try {
    // We call the node to do a dry run and estimate fees
    const fees = BigInt((await simulate()).toString());
    return fees;
  } catch (e) {
    // default value is required in case of simulation error, else user will encounter an error in the flow
    if (e instanceof SimulationError) {
      const fees = BigInt(1000);
      return fees;
    } else {
      throw new Error("Unexpected error while estimating fees.");
    }
  }
}
