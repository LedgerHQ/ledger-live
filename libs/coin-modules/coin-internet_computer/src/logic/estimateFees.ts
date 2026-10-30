import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { TRANSFER_FEE } from "../consts";
import type { IcpIntent } from "./intent";
import { isNeuronCommandIntent } from "./neuronCommand";

/**
 * The ledger's fixed transfer fee, for a send or a stake transfer. A neuron command charges nothing
 * to the account.
 */
export function estimateFees(intent: IcpIntent): FeeEstimation {
  return { value: isNeuronCommandIntent(intent) ? 0n : TRANSFER_FEE };
}
