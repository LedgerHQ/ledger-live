import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useRawTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

/**
 * Structural mirror of coin-tron's Tronify wire types (network/tronify/types.ts). Declared locally
 * rather than imported: `EnergyRentOrder.transaction` is deliberately `unknown` at the seam boundary
 * (bridge/generic-coin-framework/sponsored.ts) and coin-tron's own types are internal to that package.
 */
type TronifyUnsignedTransaction = Readonly<{
  visible: boolean;
  txID: string;
  raw_data: Record<string, unknown>;
  raw_data_hex: string;
}>;

type TronifySignedTransaction = TronifyUnsignedTransaction & Readonly<{ signature: string[] }>;

export type SponsoredRentSignatureRequest = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: string;
  broadcast: false;
}>;

export type SponsoredRentSignatureResult =
  | Readonly<{ signedOperation: SignedOperation | undefined | null; device: Device }>
  | Readonly<{ transactionSignError: Error }>;

/**
 * Inverse of coin-tron's `combine(tx, [sig])` =
 * `${tx.length.toString(16).padStart(4, "0")}${tx}${sig}` (see
 * libs/coin-modules/coin-tron/src/logic/combine.ts). The generic raw-sign path returns that combined
 * string as `signedOperation.signature`; recover the raw device signature by dropping the 4-hex-digit
 * length prefix and the echoed `raw_data_hex`.
 */
export function recoverDeviceSignature(rawDataHex: string, combinedSignature: string): string {
  return combinedSignature.slice(4 + rawDataHex.length);
}

/**
 * TRON has no named "contract data disabled" error (hw-app-trx only stubs status 0x6a80); match the
 * raw status code the same way the existing 0x6985 user-reject case is matched in hw/actions/transaction.ts.
 */
function isContractDataDisabledError(error: Error): boolean {
  return (
    (error as { name?: string }).name === "TransportStatusError" &&
    (error as { statusCode?: number }).statusCode === 0x6a80
  );
}

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

  const request = useMemo<SponsoredRentSignatureRequest | null>(() => {
    if (!account || !order) return null;
    const tx = order.transaction as TronifyUnsignedTransaction;
    return {
      account,
      parentAccount: parentAccount ?? null,
      transaction: tx.raw_data_hex,
      broadcast: false,
    };
  }, [account, parentAccount, order]);

  const onResult = useCallback(
    (result: SponsoredRentSignatureResult) => {
      if ("signedOperation" in result) {
        if (!result.signedOperation || !order || hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;
        const tx = order.transaction as TronifyUnsignedTransaction;
        const sig = recoverDeviceSignature(tx.raw_data_hex, result.signedOperation.signature);
        const signedTransaction: TronifySignedTransaction = { ...tx, signature: [sig] };
        actions.startRentPayment(signedTransaction, tx.txID);
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
