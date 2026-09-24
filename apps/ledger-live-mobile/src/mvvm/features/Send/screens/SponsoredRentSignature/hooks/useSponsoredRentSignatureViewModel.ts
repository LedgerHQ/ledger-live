import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createIntent } from "@features/platform-device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import type {
  SignRawTransactionIntent,
  SignRawTransactionIntentInput,
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
    // `toSign` is the family-derived signable hex (coin-tron's raw_data_hex), put on state at
    // CRAFT_SUCCESS so the platform never has to reach into the opaque `order.transaction`.
    if (!account || !state.toSign) return null;
    const input: SignRawTransactionIntentInput = {
      account,
      parentAccount: parentAccount ?? null,
      transaction: state.toSign,
    };
    return createIntent(signRawTronTransactionIntentLWMDefinition, input);
  }, [account, parentAccount, state.toSign]);

  const onIntentJobStateChanged = useCallback(
    (jobState: SignRawTransactionIntentJobState) => {
      if (jobState.type !== "signed") return;
      if (!order || hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      // The generic raw-sign path returns the device's combined signature; the orchestration hands it
      // to the family seam (buildSignedEnergyRentTransaction) to rebuild TX-A, so pass it through as-is.
      // Pass the paymentTxId we signed against so a signature from a since-recrafted order is rejected
      // instead of broadcast against the new one.
      actions.startRentPayment(jobState.signedOperation.signature, state.paymentTxId ?? undefined);
    },
    [order, actions, state.paymentTxId],
  );

  const onIntentJobError = useCallback(
    (error: unknown) => {
      if (isContractDataDisabledError(error)) {
        // Same staleness guard as the submit path: tie the refusal to the paymentTxId in flight.
        actions.setContractDataFailure(error as Error, state.paymentTxId ?? undefined);
      }
      // Any other error (wrong app, locked device) is handled by the executor's built-in
      // IntentErrorComponent — this screen does not need to navigate away.
    },
    [actions, state.paymentTxId],
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
