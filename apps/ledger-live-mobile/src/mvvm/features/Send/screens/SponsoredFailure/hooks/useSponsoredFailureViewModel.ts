import { useCallback } from "react";
import {
  SPONSORED_FAILURE_MESSAGE,
  getSponsoredFailureFeeTicker,
  getSponsoredFailureMessage,
  isSponsoredRetryUnaffordable,
  type SponsoredFailureMessage,
} from "@ledgerhq/live-common/flows/send/sponsored/failure";
import { useTranslation } from "~/context/Locale";
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

const FAILURE_MESSAGE_KEYS: Record<
  Exclude<SponsoredFailureMessage, typeof SPONSORED_FAILURE_MESSAGE.INSUFFICIENT_FUNDS>,
  string
> = {
  [SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT]: "send.newSendFlow.sponsoredFailure.rentPayment",
  [SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED]: "send.newSendFlow.sponsoredFailure.deliveryFailed",
  [SPONSORED_FAILURE_MESSAGE.CONTRACT_DATA]: "send.newSendFlow.sponsoredFailure.contractData",
  [SPONSORED_FAILURE_MESSAGE.TRANSFER]: "send.newSendFlow.sponsoredFailure.transfer",
};

/** actions.retry() re-enters the right phase and the overlay hosts render it: no navigation here. */
export function useSponsoredFailureViewModel(): SponsoredFailureViewModel {
  const { t } = useTranslation();
  const { state: flowState } = useSendFlowData();
  const { close, operation, status } = useSendFlowActions();
  const { state, actions, mainAccount, providerName, feeCurrencyTicker } = useSponsoredSend();

  const retryDisabled = isSponsoredRetryUnaffordable({
    state,
    mainAccount,
    account: flowState.account.account,
    transaction: flowState.transaction.transaction,
  });

  // A failed TX-C leaves the flow status on ERROR; clear it before signing again.
  const onRetry = useCallback(() => {
    if (retryDisabled) return;
    operation.onRetry();
    status.resetStatus();
    actions.retry();
  }, [retryDisabled, actions, operation, status]);

  const insufficientFunds = t("send.newSendFlow.feePayment.insufficientFunds", {
    feeCurrency: getSponsoredFailureFeeTicker(state, feeCurrencyTicker),
    provider: providerName,
  });
  const failureMessage = getSponsoredFailureMessage(state);
  let message: string | null = null;
  if (failureMessage === SPONSORED_FAILURE_MESSAGE.INSUFFICIENT_FUNDS) {
    message = insufficientFunds;
  } else if (failureMessage) {
    message = t(FAILURE_MESSAGE_KEYS[failureMessage], {
      provider: providerName,
      txidSuffix: state.paymentTxId ? ` (${state.paymentTxId})` : "",
    });
  }

  const retryLabel =
    failureMessage === SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED
      ? t("send.newSendFlow.sponsoredFailure.retryPaying")
      : t("send.newSendFlow.sponsoredFailure.retry");

  return {
    message,
    retryBlockedMessage: retryDisabled ? insufficientFunds : null,
    retryLabel,
    retryDisabled,
    cancelLabel: t("send.newSendFlow.sponsoredFailure.cancel"),
    onRetry,
    onCancel: close,
  };
}
