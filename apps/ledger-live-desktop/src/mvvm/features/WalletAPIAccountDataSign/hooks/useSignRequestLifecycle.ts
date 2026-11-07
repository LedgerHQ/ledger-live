import { useCallback, useEffect, useState } from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import type { WalletAPIAccountTarget } from "@features/platform-wallet-api-accounts";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import { useDispatch } from "LLD/hooks/redux";
import { clearPendingSignRequest } from "../pendingSignRequest";
import { closeWalletApiAccountDataSignDialog } from "../walletApiAccountDataSignDialog";

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

type Settle = {
  onCancel: () => void;
  onError: (error: Error) => void;
};

/** Review then sign: the device app comes from the account network, and the dialog closes once settled. */
export function useSignRequestLifecycle(
  requestId: number,
  account: WalletAPIAccountTarget,
  { onCancel, onError }: Settle,
  needsDevice = true,
) {
  const dispatch = useDispatch();
  const [step, setStep] = useState<"review" | "signing">("review");
  const [initializationInput, setInitializationInput] = useState<InitializationInput>();
  const network = account.entry.descriptor.network;

  const close = useCallback(() => {
    clearPendingSignRequest(requestId);
    dispatch(closeWalletApiAccountDataSignDialog());
  }, [dispatch, requestId]);

  const fail = useCallback(
    (error: unknown) => {
      onError(toError(error));
      close();
    },
    [onError, close],
  );

  useEffect(() => {
    if (!needsDevice) return;
    let active = true;
    Promise.resolve()
      .then(() => getCryptoCurrencyById(currencyIdFromNetwork(network)))
      .then(currency => buildDeviceInitializationInput({ appRequest: { currency } }))
      .then(input => {
        if (active) setInitializationInput(input);
      })
      .catch(error => {
        if (active) fail(error);
      });
    return () => {
      active = false;
    };
  }, [network, fail, needsDevice]);

  const cancel = useCallback(() => {
    onCancel();
    close();
  }, [onCancel, close]);

  const confirm = useCallback(() => setStep("signing"), []);

  const onIntentJobError = fail;

  return {
    step,
    initializationInput,
    confirm,
    cancel,
    close,
    onIntentJobError,
  };
}
