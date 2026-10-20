import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { track } from "@shared/analytics";
import {
  SPONSORED_FAILURE_MESSAGE,
  formatSponsoredOfferedFee,
  formatSponsoredRetryTime,
  getSponsoredFailureFeeTicker,
  getSponsoredFailureMessage,
  isSponsoredRetryUnaffordable,
} from "@ledgerhq/live-common/flows/send/sponsored/failure";
import { useSponsoredRetryLocked } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredRetryLocked";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
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

export function useSponsoredFailureViewModel(): SponsoredFailureViewModel {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const { state: flowState } = useSendFlowData();
  const { close, operation, status } = useSendFlowActions();
  const { state, actions, mainAccount, providerName, feeCurrencyTicker } = useSponsoredSend();
  const account = flowState.account.account;
  const transaction = flowState.transaction.transaction;
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

  const retryUnaffordable = useMemo(
    () => isSponsoredRetryUnaffordable({ state, mainAccount, account, transaction }),
    [state, mainAccount, account, transaction],
  );
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

  const onCancel = useCallback(() => {
    trackClick("cancel");
    close();
  }, [trackClick, close]);

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
    case SPONSORED_FAILURE_MESSAGE.PRICE_INCREASED:
      message = t("newSendFlow.sponsoredFailure.priceIncreased", {
        fee: formatSponsoredOfferedFee(state, locale),
      });
      retryLabel = t("newSendFlow.sponsoredFailure.acceptPrice");
      break;
    case SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT:
      message = t("newSendFlow.sponsoredFailure.rentPayment");
      break;
    case SPONSORED_FAILURE_MESSAGE.RENT_PAYMENT_REPORTED_FAILED:
      message = t("newSendFlow.sponsoredFailure.rentPaymentReportedFailed", {
        provider: providerName,
      });
      break;
    case SPONSORED_FAILURE_MESSAGE.DELIVERY_FAILED:
      message = t("newSendFlow.sponsoredFailure.deliveryFailed", {
        provider: providerName,
        txidSuffix: state.paymentTxId ? ` (${state.paymentTxId})` : "",
      });
      retryLabel = t("newSendFlow.sponsoredFailure.retryPaying");
      break;
    case SPONSORED_FAILURE_MESSAGE.TRANSFER:
      message = t("newSendFlow.sponsoredFailure.transfer");
      break;
    default:
      message = null;
  }

  let retryBlockedMessage: string | null = null;
  if (retryUnaffordable) {
    retryBlockedMessage = insufficientFunds;
  } else if (retryLocked && state.retryLockedUntil !== null) {
    retryBlockedMessage = t("newSendFlow.sponsoredFailure.retryLocked", {
      time: formatSponsoredRetryTime(state.retryLockedUntil, locale),
    });
  }

  return {
    message,
    retryBlockedMessage,
    retryLabel,
    retryDisabled,
    cancelLabel: t("newSendFlow.sponsoredFailure.cancel"),
    onRetry,
    onCancel,
  };
}
