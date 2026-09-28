import { useCallback, useEffect, useMemo, useRef } from "react";
import { track, trackPage } from "~/renderer/analytics/segment";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
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
 * unsigned payment transaction via the generic raw-sign device path, and on signature hands the
 * rebuilt Tronify-signed payload to `startRentPayment` (never `useBroadcast` — Tronify broadcasts
 * TX-A). Navigation away from this step follows `state.phase` (POLLING/FAILED), driven by the
 * shared orchestration rather than this screen's own success/error branches.
 */
export function useSponsoredRentSignatureViewModel(): SponsoredRentSignatureViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state: sendFlowState } = useSendFlowData();
  const { state, actions, quote, savingsFiatFormatted } = useSponsoredSend();
  const trackingProps = useSendFlowTrackingProperties();

  const account = sendFlowState.account.account;
  const parentAccount = sendFlowState.account.parentAccount;
  const order = state.order;

  useEffect(() => {
    trackPage("Modal send - step sponsored rent signature", null, trackingProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderTrackedRef = useRef(false);
  useEffect(() => {
    if (state.order && !orderTrackedRef.current) {
      orderTrackedRef.current = true;
      track("gas_sponsorship_order_created", {
        provider: "tronify",
        orderId: state.order.orderId,
        feePaid: state.order.payCoinAmt,
        feeCurrency: state.order.payCoinCode,
        savings: quote?.savings?.toString(),
        savingsFiat: savingsFiatFormatted,
        ...trackingProps,
      });
    }
  }, [state.order, quote, savingsFiatFormatted, trackingProps]);

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

  const request = useMemo<SponsoredRentSignatureRequest | null>(() => {
    // `toSign` is the family-derived signable hex (coin-tron's raw_data_hex), put on state at
    // CRAFT_SUCCESS so the platform never has to reach into the opaque `order.transaction`.
    if (!account || !state.toSign) return null;
    return {
      account,
      parentAccount: parentAccount ?? null,
      transaction: state.toSign,
      broadcast: false,
    };
  }, [account, parentAccount, state.toSign]);

  const onResult = useCallback(
    (result: SponsoredRentSignatureResult) => {
      if ("signedOperation" in result) {
        if (!result.signedOperation || !order || hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;
        // The generic raw-sign path returns the device's combined signature; the orchestration hands
        // it to the family seam (buildSignedEnergyRentTransaction) to rebuild TX-A, so pass it through
        // as-is. Pass the paymentTxId we signed against so a signature from a since-recrafted order is
        // rejected instead of broadcast against the new one.
        actions.startRentPayment(result.signedOperation.signature, state.paymentTxId ?? undefined);
      } else if ("transactionSignError" in result) {
        const error = result.transactionSignError;
        if (isContractDataDisabledError(error)) {
          actions.setContractDataFailure(error, state.paymentTxId ?? undefined);
        }
        // Any other sign error (user reject, locked, wrong app) is left to <DeviceAction>'s own
        // inline error+retry UI — it does not need SPONSORED_FAILURE, only a retry.
      }
    },
    [order, actions, state.paymentTxId],
  );

  // Phase -> navigation: this screen owns RENT_SIGNING/IDLE; POLLING and FAILED (any failureKind,
  // including CONTRACT_DATA) hand off to the sibling steps. Guarded so a re-render on the same
  // phase never re-dispatches GO_TO_STEP.
  const lastNavigatedPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.phase === lastNavigatedPhaseRef.current) return;
    if (state.phase === SPONSORED_PHASE.POLLING) {
      lastNavigatedPhaseRef.current = state.phase;
      navigation.goToStep(SEND_FLOW_STEP.SPONSORED_POLLING);
    } else if (state.phase === SPONSORED_PHASE.FAILED) {
      lastNavigatedPhaseRef.current = state.phase;
      navigation.goToStep(SEND_FLOW_STEP.SPONSORED_FAILURE);
    }
  }, [state.phase, navigation]);

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
