import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { createIntent } from "@ledgerhq/device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import type { SignTransactionIntentJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { signTransactionIntentLWMDefinition } from "./intentLWMDefinition";
import type { WalletApiDeviceIntentSignRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
};

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useTransactionSignatureDrawerViewModel({ request, onClose }: Props) {
  const { account, parentAccount, transaction, appName, dependencies, onSuccess, onError } =
    request;

  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
  // The wallet-api transaction is not fee-prepared (the legacy summary screen used to do
  // that). We prepare it here so gas/fees are estimated before signing directly on device,
  // which lets us skip the buffer screen. Provided fees (feesStrategy "custom") are kept.
  const [preparedTransaction, setPreparedTransaction] = useState<Transaction | null>(null);
  // Guards the dismiss handler so a successful signing (which also closes the drawer)
  // does not additionally reject the wallet-api promise via onError.
  const isSigningCompletedRef = useRef(false);

  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;

  useEffect(() => {
    let cancelled = false;
    isSigningCompletedRef.current = false;
    setPreparedTransaction(null);
    setDeviceInitializationInput(null);

    // Resolve the main account inside the async chain (rather than in render) so an
    // unexpected account shape rejects the wallet-api promise via onError/onClose instead
    // of throwing during render and crashing the webview host.
    const prepare = async () => {
      const mainAccount = getMainAccount(account, parentAccount ?? undefined);
      const [prepared, input] = await Promise.all([
        getAccountBridge(mainAccount).then(bridge =>
          bridge.prepareTransaction(mainAccount, transaction),
        ),
        buildDeviceInitializationInput({
          appRequest: {
            account: mainAccount,
            tokenCurrency,
            appName,
            dependencies: dependenciesToAppRequests(dependencies),
          },
          flow: FlowName.unknown,
        }),
      ]);
      return { prepared, input };
    };

    prepare()
      .then(({ prepared, input }) => {
        if (cancelled) return;
        setPreparedTransaction(prepared);
        setDeviceInitializationInput(input);
      })
      .catch(error => {
        if (cancelled) return;
        onError(normalizeError(error));
        onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [account, parentAccount, tokenCurrency, transaction, appName, dependencies, onError, onClose]);

  const signatureIntent = useMemo(
    () =>
      preparedTransaction
        ? createIntent(signTransactionIntentLWMDefinition, {
            account,
            parentAccount: parentAccount ?? undefined,
            transaction: preparedTransaction,
            tokenCurrency,
          })
        : null,
    [account, parentAccount, preparedTransaction, tokenCurrency],
  );

  const onIntentJobStateChanged = useCallback(
    (jobState: SignTransactionIntentJobState) => {
      if (jobState.type === "signed") {
        isSigningCompletedRef.current = true;
        onSuccess(jobState.signedOperation);
        onClose();
      }
    },
    [onSuccess, onClose],
  );

  // Dismiss semantics mirror the Send flow's DIE integration (Send's useSignatureViewModel):
  // a dismiss is intentionally treated as a user cancellation. onIntentJobError is a
  // deliberate no-op so a non-refusal signing failure keeps the executor's generic
  // IntentError screen open (Retry / Close) with the real, translated error visible to the
  // user — exactly what Send does. Send can simply close the overlay on dismiss, but a
  // wallet-api request must settle its promise; since transaction.sign has no cancel
  // channel, UserRefusedOnDevice is the conventional "user backed out" signal.
  const onIntentJobError = useCallback(() => {}, []);

  const onUserCancel = useCallback(() => {
    if (isSigningCompletedRef.current) return;
    onError(new UserRefusedOnDevice());
    onClose();
  }, [onError, onClose]);

  return {
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  };
}
