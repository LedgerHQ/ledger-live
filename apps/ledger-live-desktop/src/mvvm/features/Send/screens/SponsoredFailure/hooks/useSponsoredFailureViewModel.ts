import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import {
  SPONSORED_FAILURE_KIND,
  SPONSORED_PHASE,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSendFlowActions } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

export type SponsoredFailureViewModel = Readonly<{
  /** null for a null failureKind — defensive; the screen is only reached in FAILED, and renders
   * nothing rather than a literal "null". */
  message: string | null;
  retryLabel: string;
  cancelLabel: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

/**
 * View model for the floating SPONSORED_FAILURE step: the error/retry screen for the two-signature
 * Tronify sponsored send, parameterized by `state.failureKind`. This screen does not itself know
 * which phase a retry resumes at -- `actions.retry()` resets the shared orchestration to the
 * correct phase for the failureKind (RENT_PAYMENT/DELIVERY_FAILED -> RENT_SIGNING with a fresh
 * craft, CONTRACT_DATA -> the phase it failed on, TRANSFER -> TRANSFER), and this screen only
 * reacts to the resulting `state.phase` to navigate -- the same guarded-effect shape as
 * SPONSORED_RENT_SIGNATURE/SPONSORED_POLLING's own phase->navigation effects
 * (lastNavigatedPhaseRef), so a same-phase re-render never re-dispatches. Never navigates while
 * phase is still FAILED (this screen's own phase).
 */
export function useSponsoredFailureViewModel(): SponsoredFailureViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { close } = useSendFlowActions();
  const { state, actions } = useSponsoredSend();

  const lastNavigatedPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.phase === SPONSORED_PHASE.FAILED) return;
    if (state.phase === lastNavigatedPhaseRef.current) return;
    if (state.phase === SPONSORED_PHASE.RENT_SIGNING) {
      lastNavigatedPhaseRef.current = state.phase;
      navigation.goToStep(SEND_FLOW_STEP.SPONSORED_RENT_SIGNATURE);
    } else if (state.phase === SPONSORED_PHASE.TRANSFER) {
      lastNavigatedPhaseRef.current = state.phase;
      navigation.goToStep(SEND_FLOW_STEP.SIGNATURE);
    }
  }, [state.phase, navigation]);

  const onRetry = useCallback(() => {
    actions.retry();
  }, [actions]);

  const onCancel = useCallback(() => {
    close();
  }, [close]);

  let message: string | null;
  switch (state.failureKind) {
    case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
      message = t("newSendFlow.sponsoredFailure.rentPayment");
      break;
    case SPONSORED_FAILURE_KIND.DELIVERY_FAILED:
      // Only append the "(txid)" suffix when a payment txid exists — otherwise the copy would render
      // an empty "refund ()". The parenthetical is the whole interpolated segment, not a bare txid.
      message = t("newSendFlow.sponsoredFailure.deliveryFailed", {
        txidSuffix: state.paymentTxId ? ` (${state.paymentTxId})` : "",
      });
      break;
    case SPONSORED_FAILURE_KIND.CONTRACT_DATA:
      message = t("newSendFlow.sponsoredFailure.contractData");
      break;
    case SPONSORED_FAILURE_KIND.TRANSFER:
      message = t("newSendFlow.sponsoredFailure.transfer");
      break;
    default:
      message = null;
  }

  return {
    message,
    retryLabel: t("newSendFlow.sponsoredFailure.retry"),
    cancelLabel: t("newSendFlow.sponsoredFailure.cancel"),
    onRetry,
    onCancel,
  };
}
