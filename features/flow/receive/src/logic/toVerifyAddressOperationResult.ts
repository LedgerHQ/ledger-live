import type { VerifyAddressOutcome } from "../types";
import type { ReceiveOperationEnding } from "./receiveOperations";

export type VerifyAddressStage = "prepare" | "device";

const RESULT_OF_OUTCOME: Readonly<Record<VerifyAddressOutcome, ReceiveOperationEnding>> = {
  displayed: { type: "succeed", attributes: {} },
  verified: { type: "succeed", attributes: {} },
  unsupported: { type: "succeed", attributes: { outcome: "unsupported" } },
  mismatch: {
    type: "fail",
    reason: "ERROR",
    attributes: { outcome: "mismatch", error_name: "AddressMismatch" },
  },
  failed: { type: "fail", reason: "ERROR", attributes: {} },
  cancelled: { type: "fail", reason: "ABANDONED", attributes: { outcome: "refused" } },
  dismissed: { type: "fail", reason: "ABANDONED", attributes: {} },
};

const PREPARATION_FAILED: ReceiveOperationEnding = {
  type: "fail",
  reason: "ERROR",
  attributes: { step: "prepare" },
};

export function toVerifyAddressOperationResult(
  outcome: VerifyAddressOutcome,
  stage: VerifyAddressStage,
): ReceiveOperationEnding {
  return outcome === "failed" && stage === "prepare"
    ? PREPARATION_FAILED
    : RESULT_OF_OUTCOME[outcome];
}
