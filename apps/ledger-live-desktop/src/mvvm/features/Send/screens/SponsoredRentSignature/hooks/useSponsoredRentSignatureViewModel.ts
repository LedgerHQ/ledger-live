import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { formatFeeCurrencyAmount } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useRawTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import logger from "~/renderer/logger";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { isContractDataDisabledError } from "../../../utils/contractDataError";

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
}>;

/** TX-A: raw-signs the rent payment for the provider to broadcast — never broadcast it here. */
export function useSponsoredRentSignatureViewModel(): SponsoredRentSignatureViewModel {
  const { t } = useTranslation();
  const { state: sendFlowState } = useSendFlowData();
  const { state, actions, providerName } = useSponsoredSend();

  const account = sendFlowState.account.account;
  const parentAccount = sendFlowState.account.parentAccount;
  const order = state.order;

  const craftInFlightRef = useRef(false);
  useEffect(() => {
    const needsCraft =
      state.phase === SPONSORED_PHASE.IDLE || state.phase === SPONSORED_PHASE.RENT_SIGNING;
    if (!needsCraft || order || craftInFlightRef.current) return;
    craftInFlightRef.current = true;
    actions.craftRent().finally(() => {
      craftInFlightRef.current = false;
    });
  }, [state.phase, order, actions]);

  const submittedOrderRef = useRef<typeof order>(null);
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
        if (!result.signedOperation || !order || submittedOrderRef.current === order) return;
        submittedOrderRef.current = order;
        actions.startRentPayment(result.signedOperation.signature, signingPaymentTxId);
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
    [order, actions, signingPaymentTxId],
  );

  const onRetrySign = useCallback(() => {
    setSignError(null);
  }, []);

  const locale = useSelector(localeSelector);
  const rentPayment = state.rentPayment;
  const feeAmountLabel = useMemo(() => {
    const unit = rentPayment?.asset.unit;
    if (!rentPayment || !unit) return null;
    return formatFeeCurrencyAmount(unit, new BigNumber(rentPayment.amount.toString()), locale);
  }, [rentPayment, locale]);

  return {
    isCrafting: !order,
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
  };
}
