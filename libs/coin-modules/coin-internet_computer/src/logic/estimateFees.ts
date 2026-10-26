import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { TRANSFER_FEE } from "../consts";
import type { IcpIntent } from "./intent";
import { isNeuronCommandIntent } from "./neuronCommand";

/** The ledger's fixed transfer fee. Governance charges nothing for a neuron command. */
export function estimateFees(intent: IcpIntent): FeeEstimation {
  return { value: isNeuronCommandIntent(intent) ? 0n : TRANSFER_FEE };
}
