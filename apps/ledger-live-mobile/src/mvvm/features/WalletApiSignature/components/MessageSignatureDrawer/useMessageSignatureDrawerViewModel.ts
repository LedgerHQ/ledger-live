import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import invariant from "invariant";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import type { SignMessageIntentJobState } from "@ledgerhq/live-common/intents/signMessageIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { signMessageIntentPlatformDefinition } from "./intentDefinition";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignMessageRequest;
  /** Dismiss the drawer (clears the pending request in the webview host). */
  onClose: () => void;
};

// A retry reconnects or restarts the job, which can take a while before the next job state.
const RETRY_STARTED_STATE_TYPES = new Set<ExecutorState["type"]>([
  "connectingDevice",
  "initializingDeviceContext",
  "executingIntent",
]);

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useMessageSignatureDrawerViewModel({ request, onClose }: Props) {
  const { account, parentAccount, message, appName, dependencies, onSuccess, onError, onCancel } =
    request;

  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
  // The wallet-api promise is settled once: success, failure and dismiss race each other.
  const isSettledRef = useRef(false);
  // The failure of the last signing attempt, returned to the dApp when the user closes its
  // error screen. A retry starts a new attempt, whose job states clear it.
  const lastJobErrorRef = useRef<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    isSettledRef.current = false;
    lastJobErrorRef.current = null;
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
        if (cancelled || isSettledRef.current) return;
        isSettledRef.current = true;
        onError(normalizeError(error));
        onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [account, parentAccount, appName, dependencies, onError, onClose]);

  const signatureIntent = useMemo(
    () =>
      createIntent(signMessageIntentPlatformDefinition, {
        account,
        parentAccount: parentAccount ?? undefined,
        message,
      }),
    [account, parentAccount, message],
  );

  const onIntentJobStateChanged = useCallback(
    (jobState: SignMessageIntentJobState) => {
      lastJobErrorRef.current = null;
      if (jobState.type !== "signed" || isSettledRef.current) return;
      isSettledRef.current = true;
      onSuccess(jobState.signature);
      onClose();
    },
    [onSuccess, onClose],
  );

  // A signing failure keeps the executor's error screen open (Retry / Close), like Send does.
  // A refusal is a `cancelled` job state, not a job error.
  const onIntentJobError = useCallback((error: unknown) => {
    lastJobErrorRef.current = normalizeError(error);
  }, []);

  // A retry that reconnects the device emits no job state before it is closed: the failure
  // it replaces must not be returned for a close made during the reconnection.
  const onExecutorStateChanged = useCallback((executorState: ExecutorState) => {
    if (RETRY_STARTED_STATE_TYPES.has(executorState.type)) {
      lastJobErrorRef.current = null;
    }
  }, []);

  // message.sign has a cancel channel: a dismiss without a failure is reported through it.
  const onUserCancel = useCallback(() => {
    if (isSettledRef.current) return;
    isSettledRef.current = true;
    if (lastJobErrorRef.current) {
      onError(lastJobErrorRef.current);
    } else {
      onCancel();
    }
    onClose();
  }, [onError, onCancel, onClose]);

  return {
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  };
}
