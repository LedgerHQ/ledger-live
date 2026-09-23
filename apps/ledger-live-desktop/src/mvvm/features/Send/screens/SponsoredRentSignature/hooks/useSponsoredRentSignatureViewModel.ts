import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useRawTransactionAction } from "~/renderer/hooks/useConnectAppAction";
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
}>;

/**
 * View model for the floating SPONSORED_RENT_SIGNATURE step: TX-A of the two-signature Tronify
 * sponsored send. Crafts the energy-rent order on entry (if not already crafted), signs its
 * unsigned payment transaction via the generic raw-sign device path, and on signature hands the raw
 * device signature to `startRentPayment` (which rebuilds the signed payload behind the family seam;
 * never `useBroadcast` — the provider broadcasts TX-A). Navigation away from this step is driven by
 * `state.phase` through the shared
 * useSponsoredPhaseNavigator, not this screen's own success/error branches.
 */
export function useSponsoredRentSignatureViewModel(): SponsoredRentSignatureViewModel {
  const { t } = useTranslation();
  const { state: sendFlowState } = useSendFlowData();
  const { state, actions } = useSponsoredSend();

  const account = sendFlowState.account.account;
  const parentAccount = sendFlowState.account.parentAccount;
  const order = state.order;

  const craftInFlightRef = useRef(false);
  useEffect(() => {
    // Craft on entry whether the AMOUNT screen navigated in at IDLE (the first attempt — AMOUNT
    // only routes here, it never calls craftRent itself, so this screen is the single craft owner)
    // or the orchestration's RETRY for a RENT_PAYMENT/DELIVERY_FAILED failure reset order:null,
    // phase:RENT_SIGNING. Guarded against re-invoking while a craft is in flight.
    const needsCraft =
      state.phase === SPONSORED_PHASE.IDLE || state.phase === SPONSORED_PHASE.RENT_SIGNING;
    if (!needsCraft || order || craftInFlightRef.current) return;
    craftInFlightRef.current = true;
    actions.craftRent().finally(() => {
      craftInFlightRef.current = false;
    });
  }, [state.phase, order, actions]);

  // Defensive single-fire guard for the device signature -> startRentPayment hand-off. In
  // practice DeviceAction's OnResult only mounts once per truthy-payload transition (it renders
  // null while payload is falsy, so it can't re-fire for the same signedOperation), but this keeps
  // a second submission impossible even if that assumption ever changes, and resets per fresh order
  // so a retried cycle can submit again.
  const hasSubmittedRef = useRef(false);
  useEffect(() => {
    hasSubmittedRef.current = false;
  }, [order]);

  const action = useRawTransactionAction();

  // The device-signable hex comes from the seam via orchestration state; this screen signs it without
  // reading coin-tron's payload shape.
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

  const onResult = useCallback(
    (result: SponsoredRentSignatureResult) => {
      if ("signedOperation" in result) {
        if (!result.signedOperation || !order || hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;
        // Hand the raw combined device signature to the orchestration; the family seam rebuilds the
        // wire-shaped signed payload and captured TX-A's id at craft.
        actions.startRentPayment(result.signedOperation.signature);
      } else if ("transactionSignError" in result) {
        const error = result.transactionSignError;
        if (isContractDataDisabledError(error)) {
          actions.setContractDataFailure(error);
        }
        // Any other sign error (user reject, locked, wrong app) is left to <DeviceAction>'s own
        // inline error+retry UI — it does not need SPONSORED_FAILURE, only a retry.
      }
    },
    [order, actions],
  );

  const feeAmountLabel = order ? `${order.payCoinAmt} ${order.payCoinCode}` : null;

  return {
    isCrafting: !order,
    craftingLabel: t("newSendFlow.sponsoredRentSignature.crafting"),
    submittingLabel: t("newSendFlow.sponsoredRentSignature.submitting"),
    strategyLabel: t("newSendFlow.sponsoredRentSignature.strategy"),
    feeLabel: t("newSendFlow.sponsoredRentSignature.feeLabel"),
    feeAmountLabel,
    request,
    action,
    onResult,
  };
}
