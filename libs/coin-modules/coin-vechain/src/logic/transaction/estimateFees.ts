import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { parseAddress } from "../../common-logic";
import { craftTransaction } from "./craftTransaction";

// Estimate VTHO gas by crafting the unsigned tx and reading back its settled fee/gas parameters.
export async function estimateFees(
  intent: TransactionIntent,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  if (!intent.recipient || !parseAddress(intent.recipient)) {
    return { value: 0n, parameters: {} };
  }

  const estimationIntent =
    !intent.useAllAmount && intent.amount <= 0n ? { ...intent, amount: 1n } : intent;

  const { details } = await craftTransaction(
    estimationIntent,
    customFeesParameters ? { value: 0n, parameters: customFeesParameters } : undefined,
  );

  const fee = typeof details?.fee === "string" ? details.fee : "0";

  return {
    value: BigInt(fee),
    parameters: {
      gas: details?.gas,
      maxFeePerGas: details?.maxFeePerGas,
      maxPriorityFeePerGas: details?.maxPriorityFeePerGas,
    },
  };
}
