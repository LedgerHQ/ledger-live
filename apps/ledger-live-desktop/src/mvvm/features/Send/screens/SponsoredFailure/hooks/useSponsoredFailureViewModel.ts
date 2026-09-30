import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SPONSORED_FAILURE_KIND } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { isSponsoredFeeUnaffordable } from "../../../utils/sponsoredFeeAsset";

// Desktop doesn't depend on coin-tron, so its short-balance error is matched by name.
const ENERGY_RENT_INSUFFICIENT_BALANCE = "EnergyRentInsufficientBalance";

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
  const { state, actions, providerName, feeCurrencyTicker, feeTokenAccount } = useSponsoredSend();
  const account = flowState.account.account;
  const transaction = flowState.transaction.transaction;

  // Retrying pays a second rent while the first is only a pending reservation, which coin-tron's
  // on-chain balance check can't see; the fee token's pending ops include it.
  const retryUnaffordable = useMemo(
    () =>
      state.failureKind === SPONSORED_FAILURE_KIND.DELIVERY_FAILED &&
      !!account &&
      !!transaction &&
      !!state.rentPayment &&
      isSponsoredFeeUnaffordable({
        account,
        transaction,
        feeTokenAccount,
        rentValue: state.rentPayment.amount,
      }),
    [state.failureKind, state.rentPayment, account, transaction, feeTokenAccount],
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
    feeCurrency: feeCurrencyTicker,
    provider: providerName,
  });

  let message: string | null;
  let retryLabel = t("newSendFlow.sponsoredFailure.retry");
  switch (state.failureKind) {
    case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
      message =
        state.failureError?.name === ENERGY_RENT_INSUFFICIENT_BALANCE
          ? insufficientFunds
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
    retryBlockedMessage: retryUnaffordable ? insufficientFunds : null,
    retryLabel,
    retryDisabled: retryUnaffordable,
    cancelLabel: t("newSendFlow.sponsoredFailure.cancel"),
    onRetry,
    onCancel,
  };
}
