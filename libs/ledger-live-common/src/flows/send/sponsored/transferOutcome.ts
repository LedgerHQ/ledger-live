import { SEND_FLOW_COMPLETION, type SendFlowCompletion } from "../types";
import { isContractDataDisabledError } from "./failure";
import type { SponsoredSendActions } from "./useSponsoredSendOrchestration";

/** Reports a sponsored TX-C outcome to the orchestration, which moves to DONE or FAILED. */
export function reportSponsoredTransferOutcome({
  actions,
  signedPaymentTxId,
  completion,
  error,
}: Readonly<{
  actions: Pick<
    SponsoredSendActions,
    "onTransferSuccess" | "onTransferError" | "setContractDataFailure"
  >;
  signedPaymentTxId: string | null;
  completion: SendFlowCompletion;
  error?: Error;
}>): void {
  if (completion === SEND_FLOW_COMPLETION.SUCCESS) {
    actions.onTransferSuccess(signedPaymentTxId);
    return;
  }
  const failure = error ?? new Error("Sponsored transfer failed");
  if (isContractDataDisabledError(failure)) {
    actions.setContractDataFailure(failure, signedPaymentTxId);
  } else {
    actions.onTransferError(failure, signedPaymentTxId);
  }
}
