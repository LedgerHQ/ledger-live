import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import invariant from "invariant";
import { createIntent } from "@ledgerhq/device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import type { SignMessageIntentJobState } from "@ledgerhq/live-common/intents/signMessageIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { signMessageIntentLWMDefinition } from "./intentLWMDefinition";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignMessageRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
};

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useMessageSignatureDrawerViewModel({ request, onClose }: Props) {
  const { account, parentAccount, message, appName, dependencies, onSuccess, onError, onCancel } =
    request;

  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
  // Guards the dismiss handler so a successful signing (which also closes the drawer)
  // does not additionally reject the wallet-api promise via onCancel.
  const isSigningCompletedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    isSigningCompletedRef.current = false;
    setDeviceInitializationInput(null);

    // Unlike a transaction, the wallet-api message is already prepared upstream
    // (signMessageLogic → prepareMessageToSign), so we only need to resolve which app
    // must be opened before connecting to the device. Run it inside the async chain so a
    // failure rejects the wallet-api promise via onError/onClose instead of crashing render.
    const prepare = async () => {
      // wallet-api resolves message.sign to a top-level account and never passes a
      // parentAccount, so a token account is never expected here.
      invariant(account.type === "Account", "walletApiSignMessage: expected a main account");
      const mainAccount = getMainAccount(account, parentAccount ?? undefined);
      return buildDeviceInitializationInput({
        appRequest: {
          account: mainAccount,
          appName,
          dependencies: dependenciesToAppRequests(dependencies),
        },
        flow: FlowName.unknown,
      });
    };

    prepare()
      .then(input => {
        if (cancelled) return;
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
  }, [account, parentAccount, appName, dependencies, onError, onClose]);

  const signatureIntent = useMemo(
    () =>
      createIntent(signMessageIntentLWMDefinition, {
        account,
        parentAccount: parentAccount ?? undefined,
        message,
      }),
    [account, parentAccount, message],
  );

  const onIntentJobStateChanged = useCallback(
    (jobState: SignMessageIntentJobState) => {
      if (jobState.type === "signed") {
        isSigningCompletedRef.current = true;
        onSuccess(jobState.signature);
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
  // wallet-api request must settle its promise; message.sign exposes a dedicated cancel
  // channel, so we report onCancel().
  const onIntentJobError = useCallback(() => {}, []);

  const onUserCancel = useCallback(() => {
    if (isSigningCompletedRef.current) return;
    onCancel();
    onClose();
  }, [onCancel, onClose]);

  return {
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  };
}
