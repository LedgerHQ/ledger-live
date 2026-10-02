import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  SPONSORED_FAILURE_MESSAGE,
  getSponsoredFailureFeeTicker,
  getSponsoredFailureMessage,
  isSponsoredRetryUnaffordable,
} from "@ledgerhq/live-common/flows/send/sponsored/failure";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

export type SponsoredFailureViewModel = Readonly<{
  message: string | null;
  /** Why retrying is blocked; null when it isn't. */
  retryBlockedMessage: string | null;
  retryLabel: string;
  retryDisabled: boolean;
  cancelLabel: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function useSponsoredFailureViewModel(): SponsoredFailureViewModel {
  const { t } = useTranslation();
  const { state: flowState } = useSendFlowData();
  const { close, operation, status } = useSendFlowActions();
  const { state, actions, mainAccount, providerName, feeCurrencyTicker } = useSponsoredSend();
  const account = flowState.account.account;
  const transaction = flowState.transaction.transaction;

  const retryUnaffordable = useMemo(
    () => isSponsoredRetryUnaffordable({ state, mainAccount, account, transaction }),
    [state, mainAccount, account, transaction],
  );

  // A failed TX-C leaves the flow status on ERROR; clear it before signing again.
  const onRetry = useCallback(() => {
    if (retryUnaffordable) return;
    operation.onRetry();
    status.resetStatus();
    actions.retry();
  }, [retryUnaffordable, actions, operation, status]);

  const onCancel = useCallback(() => {
    close();
  }, [close]);

  const insufficientFunds = t("newSendFlow.feePayment.insufficientFunds", {
    feeCurrency: getSponsoredFailureFeeTicker(state, feeCurrencyTicker),
    provider: providerName,
  });

  let message: string | null;
  let retryLabel = t("newSendFlow.sponsoredFailure.retry");
  switch (getSponsoredFailureMessage(state)) {
    case SPONSORED_FAILURE_MESSAGE.INSUFFICIENT_FUNDS:
      message = insufficientFunds;
      break;
    case SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT:
      message = t("newSendFlow.sponsoredFailure.rentPayment");
      break;
    case SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED:
      message = t("newSendFlow.sponsoredFailure.deliveryFailed", {
        provider: providerName,
        txidSuffix: state.paymentTxId ? ` (${state.paymentTxId})` : "",
      });
      retryLabel = t("newSendFlow.sponsoredFailure.retryPaying");
      break;
    case SPONSORED_FAILURE_MESSAGE.CONTRACT_DATA:
      message = t("newSendFlow.sponsoredFailure.contractData");
      break;
    case SPONSORED_FAILURE_MESSAGE.TRANSFER:
      message = t("newSendFlow.sponsoredFailure.transfer");
      break;
    default:
      message = null;
  }

  return {
    message,
    retryBlockedMessage: retryUnaffordable ? insufficientFunds : null,
    retryLabel,
    retryDisabled: retryUnaffordable,
    cancelLabel: t("newSendFlow.sponsoredFailure.cancel"),
    onRetry,
    onCancel,
  };
}
