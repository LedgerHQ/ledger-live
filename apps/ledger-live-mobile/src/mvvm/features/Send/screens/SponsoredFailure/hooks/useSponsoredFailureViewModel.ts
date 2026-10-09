import { useCallback } from "react";
import { track } from "@shared/analytics";
import {
  SPONSORED_FAILURE_MESSAGE,
  formatSponsoredOfferedFee,
  formatSponsoredRetryTime,
  getSponsoredFailureFeeTicker,
  getSponsoredFailureMessage,
  isSponsoredRetryUnaffordable,
  type SponsoredFailureMessage,
} from "@ledgerhq/live-common/flows/send/sponsored/failure";
import { useSponsoredRetryLocked } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredRetryLocked";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { localeSelector } from "~/reducers/settings";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { useSendFlowTracking } from "../../../context/SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { getSendFlowTrackingPage } from "../../../utils/contactTracking";

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
  [SPONSORED_FAILURE_MESSAGE.PRICE_INCREASED]: "send.newSendFlow.sponsoredFailure.priceIncreased",
  [SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT]: "send.newSendFlow.sponsoredFailure.rentPayment",
  [SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT_REPORTED_FAILED]:
    "send.newSendFlow.sponsoredFailure.rentPaymentReportedFailed",
  [SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED]: "send.newSendFlow.sponsoredFailure.deliveryFailed",
  [SPONSORED_FAILURE_MESSAGE.TRANSFER]: "send.newSendFlow.sponsoredFailure.transfer",
};

const RETRY_LABEL_KEYS: Partial<Record<SponsoredFailureMessage, string>> = {
  [SPONSORED_FAILURE_MESSAGE.PRICE_INCREASED]: "send.newSendFlow.sponsoredFailure.acceptPrice",
  [SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED]: "send.newSendFlow.sponsoredFailure.retryPaying",
};

/** actions.retry() re-enters the right phase and the overlay hosts render it: no navigation here. */
export function useSponsoredFailureViewModel(): SponsoredFailureViewModel {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const { state: flowState } = useSendFlowData();
  const { close, operation, status } = useSendFlowActions();
  const { state, actions, mainAccount, providerName, feeCurrencyTicker } = useSponsoredSend();
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  const { flowSessionId } = useSendFlowTracking();
  const failureKind = state.failureKind;
  const trackClick = useCallback(
    (button: "retry" | "cancel") =>
      track("button_clicked", {
        button,
        page: getSendFlowTrackingPage(SEND_FLOW_STEP.SPONSORED_FAILURE),
        failure_kind: failureKind,
        flow_session_id: flowSessionId,
        ...sendFlowTrackingProperties,
      }),
    [failureKind, flowSessionId, sendFlowTrackingProperties],
  );
  const onCancel = useCallback(() => {
    trackClick("cancel");
    close();
  }, [trackClick, close]);

  const retryUnaffordable = isSponsoredRetryUnaffordable({
    state,
    mainAccount,
    account: flowState.account.account,
    transaction: flowState.transaction.transaction,
  });
  const retryLocked = useSponsoredRetryLocked(state.retryLockedUntil);
  const retryDisabled = retryUnaffordable || retryLocked;

  // A failed TX-C leaves the flow status on ERROR; clear it before signing again.
  const onRetry = useCallback(() => {
    if (retryDisabled) return;
    trackClick("retry");
    operation.onRetry();
    status.resetStatus();
    actions.retry();
  }, [retryDisabled, trackClick, actions, operation, status]);

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
      fee: formatSponsoredOfferedFee(state, locale),
    });
  }

  const retryLabel = t(
    (failureMessage && RETRY_LABEL_KEYS[failureMessage]) ??
      "send.newSendFlow.sponsoredFailure.retry",
  );

  let retryBlockedMessage: string | null = null;
  if (retryUnaffordable) {
    retryBlockedMessage = insufficientFunds;
  } else if (retryLocked && state.retryLockedUntil !== null) {
    retryBlockedMessage = t("send.newSendFlow.sponsoredFailure.retryLocked", {
      time: formatSponsoredRetryTime(state.retryLockedUntil, locale),
    });
  }

  return {
    message,
    retryBlockedMessage,
    retryLabel,
    retryDisabled,
    cancelLabel: t("send.newSendFlow.sponsoredFailure.cancel"),
    onRetry,
    onCancel,
  };
}
