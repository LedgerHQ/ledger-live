import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SPONSORED_FAILURE_KIND } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSendFlowActions } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

// Desktop doesn't depend on coin-tron, so its short-balance error is matched by name.
const ENERGY_RENT_INSUFFICIENT_BALANCE = "EnergyRentInsufficientBalance";

export type SponsoredFailureViewModel = Readonly<{
  message: string | null;
  retryLabel: string;
  cancelLabel: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function useSponsoredFailureViewModel(): SponsoredFailureViewModel {
  const { t } = useTranslation();
  const { close, operation, status } = useSendFlowActions();
  const { state, actions, providerName, feeCurrencyTicker } = useSponsoredSend();

  // A failed TX-C leaves the flow status on ERROR; clear it before signing again.
  const onRetry = useCallback(() => {
    operation.onRetry();
    status.resetStatus();
    actions.retry();
  }, [actions, operation, status]);

  const onCancel = useCallback(() => {
    close();
  }, [close]);

  let message: string | null;
  let retryLabel = t("newSendFlow.sponsoredFailure.retry");
  switch (state.failureKind) {
    case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
      message =
        state.failureError?.name === ENERGY_RENT_INSUFFICIENT_BALANCE
          ? t("newSendFlow.feePayment.insufficientFunds", {
              feeCurrency: feeCurrencyTicker,
              provider: providerName,
            })
          : t("newSendFlow.sponsoredFailure.rentPayment");
      break;
    case SPONSORED_FAILURE_KIND.DELIVERY_FAILED:
      message = t("newSendFlow.sponsoredFailure.deliveryFailed", {
        provider: providerName,
        txidSuffix: state.paymentTxId ? ` (${state.paymentTxId})` : "",
      });
      retryLabel = t("newSendFlow.sponsoredFailure.retryPaying");
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
    retryLabel,
    cancelLabel: t("newSendFlow.sponsoredFailure.cancel"),
    onRetry,
    onCancel,
  };
}
