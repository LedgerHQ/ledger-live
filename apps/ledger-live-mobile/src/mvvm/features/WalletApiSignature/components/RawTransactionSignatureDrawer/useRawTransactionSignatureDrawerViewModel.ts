import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { SignRawTransactionIntentJobState } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { getConnectAppDependencies } from "../../utils/connectAppDependencies";
import { getSignatureSourceFlow } from "../../utils/getSignatureSourceFlow";
import { signRawTransactionIntentPlatformDefinition } from "./intentDefinition";
import type { WalletApiDeviceIntentSignRawRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignRawRequest;
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

export function useRawTransactionSignatureDrawerViewModel({ request, onClose }: Props) {
  const {
    account,
    parentAccount,
    transaction,
    broadcast,
    appName,
    dependencies,
    onSuccess,
    onError,
  } = request;

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

    // Resolve the main account inside the async chain (rather than in render) so an
    // unexpected account shape rejects the wallet-api promise via onError/onClose instead
    // of throwing during render and crashing the webview host.
    const prepare = async () => {
      const mainAccount = getMainAccount(account, parentAccount ?? undefined);
      // Same fallback as the app resolution: an empty name opens the account's app.
      const openedAppName = appName || mainAccount.currency.managerAppName;
      return buildDeviceInitializationInput({
        appRequest: {
          account: mainAccount,
          appName,
          // Same app rule as the SignRawTransaction stack: an app allowed to sign in place
          // of the account's app (e.g. one derived from the Bitcoin app) does not need it.
          // The opened app is never its own dependency: any dependency makes the device quit
          // the app to list the installed ones, then open it again.
          dependencies: getConnectAppDependencies(
            mainAccount.currency,
            appName,
            dependencies,
          ).filter(
            dependency =>
              (dependency.appName ?? dependency.currency?.managerAppName) !== openedAppName,
          ),
        },
        flow: FlowName.unknown,
      });
    };

    prepare()
      .then(input => {
        if (!cancelled) setDeviceInitializationInput(input);
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
      createIntent(signRawTransactionIntentPlatformDefinition, {
        account,
        parentAccount: parentAccount ?? undefined,
        transaction,
        broadcast,
      }),
    [account, parentAccount, transaction, broadcast],
  );

  const onIntentJobStateChanged = useCallback(
    (jobState: SignRawTransactionIntentJobState) => {
      lastJobErrorRef.current = null;
      if (jobState.type !== "signed" || isSettledRef.current) return;
      isSettledRef.current = true;
      onSuccess(jobState.signedOperation);
      onClose();
    },
    [onSuccess, onClose],
  );

  // A signing failure keeps the executor's error screen open (Retry / Close).
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

  // transaction.signRaw has no cancel channel: a dismiss without a failure is reported as
  // UserRefusedOnDevice, the conventional "user backed out" signal.
  const onUserCancel = useCallback(() => {
    if (isSettledRef.current) return;
    isSettledRef.current = true;
    onError(lastJobErrorRef.current ?? new UserRefusedOnDevice());
    onClose();
  }, [onError, onClose]);

  return {
    sourceFlow: getSignatureSourceFlow(request.manifestId),
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  };
}
