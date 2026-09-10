import { useCallback } from "react";
import {
  SPONSORED_FAILURE_KIND,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useTranslation } from "~/context/Locale";
import { useSendFlowActions } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

export type SponsoredFailureViewModel = Readonly<{
  message: string | null;
  retryLabel: string;
  cancelLabel: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

/**
 * View model for the SPONSORED_FAILURE overlay. Provides retry/cancel actions and a
 * failure-kind-specific message. actions.retry() re-enters the correct phase; SponsoredFlowHost
 * then renders the corresponding screen (no navigation needed on mobile — the host reacts to phase).
 */
export function useSponsoredFailureViewModel(): SponsoredFailureViewModel {
  const { t } = useTranslation();
  const { close } = useSendFlowActions();
  const { state, actions } = useSponsoredSend();

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
