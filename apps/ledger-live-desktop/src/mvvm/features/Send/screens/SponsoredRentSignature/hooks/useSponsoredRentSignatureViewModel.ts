import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { isContractDataDisabledError } from "@ledgerhq/live-common/flows/send/sponsored/failure";
import { useSponsoredRentPayment } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredRentPayment";
import { useRawTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import logger from "~/renderer/logger";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

export type SponsoredRentSignatureRequest = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: string;
  broadcast: false;
}>;

export type SponsoredRentSignatureResult =
  | Readonly<{ signedOperation: SignedOperation | undefined | null; device: Device }>
  | Readonly<{ transactionSignError: Error }>;

const DEVICE_REFUSAL_ERROR_NAMES: ReadonlySet<string> = new Set([
  "TransactionRefusedOnDevice",
  "UserRefusedOnDevice",
]);

export type SponsoredRentSignatureViewModel = Readonly<{
  isCrafting: boolean;
  craftingLabel: string;
  submittingLabel: string;
  strategyLabel: string;
  feeLabel: string;
  feeAmountLabel: string | null;
  request: SponsoredRentSignatureRequest | null;
  action: ReturnType<typeof useRawTransactionAction>;
  onResult: (result: SponsoredRentSignatureResult) => void;
  signError: Error | null;
  onRetrySign: () => void;
  cancelLabel: string;
  onCancel: () => void;
}>;

/** TX-A: raw-signs the rent payment for the provider to broadcast — never broadcast it here. */
export function useSponsoredRentSignatureViewModel(): SponsoredRentSignatureViewModel {
  const { t } = useTranslation();
  const { state: sendFlowState } = useSendFlowData();
  const { close } = useSendFlowActions();
  const { state, actions, providerName } = useSponsoredSend();

  const locale = useSelector(localeSelector);
  const { isCrafting, feeAmountLabel, submitSignature } = useSponsoredRentPayment({
    state,
    actions,
    locale,
  });

  const account = sendFlowState.account.account;
  const parentAccount = sendFlowState.account.parentAccount;

  const [signError, setSignError] = useState<Error | null>(null);

  const action = useRawTransactionAction();

  const toSign = state.toSign;
  const request = useMemo<SponsoredRentSignatureRequest | null>(() => {
    if (!account || !toSign) return null;
    return {
      account,
      parentAccount: parentAccount ?? null,
      transaction: toSign,
      broadcast: false,
    };
  }, [account, parentAccount, toSign]);

  const signingPaymentTxId = state.paymentTxId;
  const onResult = useCallback(
    (result: SponsoredRentSignatureResult) => {
      if ("signedOperation" in result) {
        if (result.signedOperation) submitSignature(result.signedOperation.signature);
      } else if ("transactionSignError" in result) {
        const error = result.transactionSignError;
        if (isContractDataDisabledError(error)) {
          actions.setContractDataFailure(error, signingPaymentTxId);
        } else {
          if (!DEVICE_REFUSAL_ERROR_NAMES.has(error.name)) {
            logger.critical(error);
          }
          // DeviceAction offers a retry for connect errors only, never for a sign error.
          setSignError(error);
        }
      }
    },
    [submitSignature, actions, signingPaymentTxId],
  );

  const onRetrySign = useCallback(() => {
    setSignError(null);
  }, []);

  return {
    isCrafting,
    craftingLabel: t("newSendFlow.sponsoredRentSignature.crafting"),
    submittingLabel: t("newSendFlow.sponsoredRentSignature.submitting"),
    strategyLabel: t("newSendFlow.sponsoredRentSignature.strategy", { provider: providerName }),
    feeLabel: t("newSendFlow.sponsoredRentSignature.feeLabel"),
    feeAmountLabel,
    request,
    action,
    onResult,
    signError,
    onRetrySign,
    cancelLabel: t("newSendFlow.sponsoredFailure.cancel"),
    onCancel: close,
  };
}
