import { isRecovered, type CheckErrorCauseStateMachineOutput } from "../types";

/**
 * The device answered twice from the dashboard, with no successful action in between and nothing
 * explaining the failure, eg: a backend error: retrying again would loop forever.
 */
export function isRepeatedUnexplainedRecovery(
  hasUnexplainedRecovery: boolean,
  output: CheckErrorCauseStateMachineOutput,
): boolean {
  return hasUnexplainedRecovery && isRecovered(output) && output.isUnexplained;
}

export function hasUnexplainedRecoveryAfter(
  hasUnexplainedRecovery: boolean,
  output: CheckErrorCauseStateMachineOutput,
): boolean {
  return hasUnexplainedRecovery || (isRecovered(output) && output.isUnexplained);
}
