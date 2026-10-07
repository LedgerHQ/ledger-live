import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { log } from "@ledgerhq/logs";
import { createIntent } from "@features/platform-device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { EnergyRentOrder } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import { isContractDataDisabledError } from "@ledgerhq/live-common/flows/send/sponsored/failure";
import { useSponsoredRentPayment } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredRentPayment";
import type {
  SignRawTransactionIntent,
  SignRawTransactionIntentInput,
  SignRawTransactionIntentJobState,
} from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { localeSelector } from "~/reducers/settings";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import type { RentSignatureExtraProps } from "../intents/signRawTransactionIntent/componentLWM";
import { signRawTransactionIntentLWMDefinition } from "../intents/signRawTransactionIntent/intentLWMDefinition";

const LOG_TYPE = "sponsored-send";

export type RentSignIntent = SignRawTransactionIntent<RentSignatureExtraProps>;

export type SponsoredRentSignatureStep =
  | Readonly<{ type: "loading" }>
  | Readonly<{ type: "error"; error: Error }>
  | Readonly<{
      type: "signing";
      deviceInitializationInput: InitializationInput;
      signIntent: RentSignIntent;
    }>;

export type SponsoredRentSignatureViewModel = Readonly<{
  step: SponsoredRentSignatureStep;
  craftingLabel: string;
  feeAmountLabel: string | null;
  cancelLabel: string;
  intentExtraProps: RentSignatureExtraProps;
  onIntentJobStateChanged: (jobState: SignRawTransactionIntentJobState) => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
}>;

type DeviceInitialization = Readonly<
  { order: EnergyRentOrder; input: InitializationInput } | { order: EnergyRentOrder; error: Error }
>;

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** TX-A: raw-signs the rent payment for the provider to broadcast — never broadcast it here. */
export function useSponsoredRentSignatureViewModel(): SponsoredRentSignatureViewModel {
  const { t } = useTranslation();
  const { state: sendFlowState } = useSendFlowData();
  const { stopSigning } = useSendSignature();
  const { state, actions, providerName, approvedFee } = useSponsoredSend();
  const locale = useSelector(localeSelector);
  const { isCrafting, feeAmountLabel, submitSignature } = useSponsoredRentPayment({
    state,
    actions,
    approvedFee,
    locale,
  });

  const account = sendFlowState.account.account;
  const parentAccount = sendFlowState.account.parentAccount;
  const { order, toSign } = state;

  // Built once per order: a new input while signing makes the executor drop the operation, and the
  // flow follows the synced account, so every account refresh would otherwise rebuild it.
  const [deviceInitialization, setDeviceInitialization] = useState<DeviceInitialization | null>(
    null,
  );
  const initializedOrder = deviceInitialization?.order ?? null;
  useEffect(() => {
    if (!account || !order || initializedOrder === order) return;

    let cancelled = false;
    buildDeviceInitializationInput({
      appRequest: { account: getMainAccount(account, parentAccount ?? undefined) },
      flow: FlowName.send,
    })
      .then(input => {
        if (!cancelled) setDeviceInitialization({ order, input });
      })
      .catch((error: unknown) => {
        log(LOG_TYPE, "TX-A device setup failed", { error });
        if (!cancelled) setDeviceInitialization({ order, error: normalizeError(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [account, parentAccount, order, initializedOrder]);

  // Pinned to its bytes for the same reason.
  const [signIntent, setSignIntent] = useState<RentSignIntent | null>(null);
  useEffect(() => {
    if (!account || !toSign) {
      setSignIntent(null);
      return;
    }
    const input: SignRawTransactionIntentInput = {
      account,
      parentAccount: parentAccount ?? null,
      transaction: toSign,
    };
    setSignIntent(previous =>
      previous?.input.transaction === toSign
        ? previous
        : createIntent(signRawTransactionIntentLWMDefinition, input),
    );
  }, [account, parentAccount, toSign]);

  // Set once TX-A belongs to the orchestration: the sheet calls onUserCancel when it unmounts,
  // and resetting then would drop a paid rent.
  const handedOffRef = useRef(false);
  const onIntentJobStateChanged = useCallback(
    (jobState: SignRawTransactionIntentJobState) => {
      if (jobState.type !== "signed") return;
      handedOffRef.current = true;
      submitSignature(jobState.signedOperation.signature);
    },
    [submitSignature],
  );

  // Other errors stay on the executor's own error screen, which offers a retry.
  const signingPaymentTxId = state.paymentTxId;
  const onIntentJobError = useCallback(
    (error: unknown) => {
      if (isContractDataDisabledError(error)) {
        handedOffRef.current = true;
        actions.setContractDataFailure(error, signingPaymentTxId);
        return;
      }
      log(LOG_TYPE, "TX-A signing failed", { error });
    },
    [actions, signingPaymentTxId],
  );

  const onUserCancel = useCallback(() => {
    if (handedOffRef.current) return;
    stopSigning();
    actions.reset();
  }, [actions, stopSigning]);

  const intentExtraProps = useMemo<RentSignatureExtraProps>(
    () => ({
      strategyLabel: t("send.newSendFlow.sponsoredRentSignature.strategy", {
        provider: providerName,
      }),
      feeLabel: feeAmountLabel
        ? t("send.newSendFlow.sponsoredRentSignature.fee", { amount: feeAmountLabel })
        : null,
    }),
    [t, providerName, feeAmountLabel],
  );

  const currentInitialization = deviceInitialization?.order === order ? deviceInitialization : null;
  let step: SponsoredRentSignatureStep = { type: "loading" };
  if (currentInitialization && "error" in currentInitialization) {
    step = { type: "error", error: currentInitialization.error };
  } else if (!isCrafting && currentInitialization && signIntent) {
    step = {
      type: "signing",
      deviceInitializationInput: currentInitialization.input,
      signIntent,
    };
  }

  return {
    step,
    craftingLabel: t("send.newSendFlow.sponsoredRentSignature.crafting"),
    feeAmountLabel,
    cancelLabel: t("send.newSendFlow.sponsoredFailure.cancel"),
    intentExtraProps,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  };
}
