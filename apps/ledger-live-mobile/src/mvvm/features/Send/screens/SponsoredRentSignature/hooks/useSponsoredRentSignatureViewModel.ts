import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent } from "@features/platform-device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import type {
  SignRawTransactionIntent,
  SignRawTransactionIntentJobState,
} from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import { signRawTronTransactionIntentLWMDefinition } from "../intents/signRawTronTransactionIntent/intentLWMDefinition";

/**
 * Structural mirror of coin-tron's Tronify wire types (network/tronify/types.ts). Declared locally
 * rather than imported: EnergyRentOrder.transaction is `unknown` at the seam boundary.
 */
type TronifyUnsignedTransaction = Readonly<{
  visible: boolean;
  txID: string;
  raw_data: Record<string, unknown>;
  raw_data_hex: string;
}>;

type TronifySignedTransaction = TronifyUnsignedTransaction & Readonly<{ signature: string[] }>;

/**
 * Inverse of coin-tron's combine(tx, [sig]) =
 * `${tx.length.toString(16).padStart(4,"0")}${tx}${sig}` (see combine.ts).
 * The generic raw-sign path returns the combined string as signedOperation.signature;
 * recover the raw device signature by dropping the 4-hex-digit length prefix + echoed raw_data_hex.
 */
export function recoverDeviceSignature(rawDataHex: string, combinedSignature: string): string {
  return combinedSignature.slice(4 + rawDataHex.length);
}

function isContractDataDisabledError(error: unknown): boolean {
  return (
    (error as { name?: string })?.name === "TransportStatusError" &&
    (error as { statusCode?: number })?.statusCode === 0x6a80
  );
}

export type SponsoredRentSignatureViewModel = Readonly<{
  isCrafting: boolean;
  feeAmountLabel: string | null;
  deviceInitializationInput: InitializationInput | null;
  signIntent: SignRawTransactionIntent | null;
  onIntentJobStateChanged: (jobState: SignRawTransactionIntentJobState) => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
}>;

export function useSponsoredRentSignatureViewModel(): SponsoredRentSignatureViewModel {
  const { state: sendFlowState } = useSendFlowData();
  const { stopSigning } = useSendSignature();
  const { state, actions, selectStandard } = useSponsoredSend();

  const account = sendFlowState.account.account;
  const parentAccount = sendFlowState.account.parentAccount;
  const order = state.order;

  // Re-craft on retry: RENT_PAYMENT/DELIVERY_FAILED failures reset order to null while keeping
  // phase RENT_SIGNING. The initial craft is triggered by Amount's onReview (Tronify path).
  const craftInFlightRef = useRef(false);
  useEffect(() => {
    const needsCraft = state.phase === SPONSORED_PHASE.RENT_SIGNING;
    if (!needsCraft || order || craftInFlightRef.current) return;
    craftInFlightRef.current = true;
    actions.craftRent().finally(() => {
      craftInFlightRef.current = false;
    });
  }, [state.phase, order, actions]);

  // Reset per fresh order so a retried cycle can submit again.
  const hasSubmittedRef = useRef(false);
  useEffect(() => {
    hasSubmittedRef.current = false;
  }, [order]);

  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);

  useEffect(() => {
    if (!account || !order) {
      setDeviceInitializationInput(null);
      return;
    }

    let cancelled = false;
    const mainAccount = getMainAccount(account, parentAccount ?? undefined);

    buildDeviceInitializationInput({
      appRequest: { account: mainAccount },
      flow: FlowName.send,
    })
      .then(input => {
        if (!cancelled) setDeviceInitializationInput(input);
      })
      .catch(() => {
        if (!cancelled) setDeviceInitializationInput(null);
      });

    return () => {
      cancelled = true;
    };
  }, [account, parentAccount, order]);

  const signIntent = useMemo<SignRawTransactionIntent | null>(() => {
    if (!account || !order) return null;
    const tx = order.transaction as TronifyUnsignedTransaction;
    return createIntent(signRawTronTransactionIntentLWMDefinition, {
      account,
      parentAccount: parentAccount ?? null,
      transaction: tx.raw_data_hex,
    });
  }, [account, parentAccount, order]);

  const onIntentJobStateChanged = useCallback(
    (jobState: SignRawTransactionIntentJobState) => {
      if (jobState.type !== "signed") return;
      if (!order || hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      const tx = order.transaction as TronifyUnsignedTransaction;
      const sig = recoverDeviceSignature(tx.raw_data_hex, jobState.signedOperation.signature);
      const signedTransaction: TronifySignedTransaction = { ...tx, signature: [sig] };
      actions.startRentPayment(signedTransaction, tx.txID);
    },
    [order, actions],
  );

  const onIntentJobError = useCallback(
    (error: unknown) => {
      if (isContractDataDisabledError(error)) {
        actions.setContractDataFailure(error as Error);
      }
      // Any other error (wrong app, locked device) is handled by the executor's built-in
      // IntentErrorComponent — this screen does not need to navigate away.
    },
    [actions],
  );

  const onUserCancel = useCallback(() => {
    stopSigning();
    selectStandard();
    actions.reset();
  }, [actions, selectStandard, stopSigning]);

  const feeAmountLabel = order ? `${order.payCoinAmt} ${order.payCoinCode}` : null;

  return {
    isCrafting: !order,
    feeAmountLabel,
    deviceInitializationInput,
    signIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  };
}
