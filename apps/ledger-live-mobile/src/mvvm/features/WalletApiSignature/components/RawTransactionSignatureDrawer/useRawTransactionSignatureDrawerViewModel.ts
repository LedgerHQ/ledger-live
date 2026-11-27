import { useCallback, useEffect, useRef, useState } from "react";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { SignedOperation } from "@ledgerhq/types-live";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { getConnectAppDependencies } from "../../utils/connectAppDependencies";
import { getSignatureSourceFlow } from "../../utils/getSignatureSourceFlow";
import { signRawTransactionIntentPlatformDefinition } from "./intentDefinition";
import type { WalletApiDeviceIntentSignRawRequest } from "./types";

type Signing = Readonly<{
  deviceInitializationInput: InitializationInput;
  signatureIntent: ReturnType<typeof createSignatureIntent>;
}>;

function createSignatureIntent(
  request: WalletApiDeviceIntentSignRawRequest,
  onResult: (signedOperation: SignedOperation) => void,
) {
  const { account, parentAccount, transaction, broadcast, manifestId } = request;
  return createIntent(
    signRawTransactionIntentPlatformDefinition,
    { account, parentAccount: parentAccount ?? undefined, transaction, broadcast, manifestId },
    { onResult },
  );
}

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
  const { account, parentAccount, appName, dependencies, onSuccess, onError } = request;

  // The executor's two inputs change together, in one render.
  const [signing, setSigning] = useState<Signing | null>(null);
  // The wallet-api promise is settled once: success, failure and dismiss race each other.
  const isSettledRef = useRef(false);
  // The failure of the last signing attempt, returned to the dApp when the user closes its
  // error screen. A retry starts a new attempt, whose job states clear it.
  const lastJobErrorRef = useRef<Error | null>(null);
  // The signed operation the job reports. The request settles once the job has completed.
  const signedOperationRef = useRef<SignedOperation | null>(null);

  useEffect(() => {
    let cancelled = false;
    isSettledRef.current = false;
    lastJobErrorRef.current = null;
    signedOperationRef.current = null;

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
      .then(deviceInitializationInput => {
        if (cancelled) return;
        const signatureIntent = createSignatureIntent(request, signedOperation => {
          signedOperationRef.current = signedOperation;
        });
        setSigning({ deviceInitializationInput, signatureIntent });
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
  }, [request, account, parentAccount, appName, dependencies, onError, onClose]);

  // A new job state means a new signing attempt: the failure it replaces is no longer current.
  const onIntentJobStateChanged = useCallback(() => {
    lastJobErrorRef.current = null;
  }, []);

  // Settling advances the request queue, which unmounts the executor: the job must have ended.
  const onIntentJobComplete = useCallback(() => {
    const signedOperation = signedOperationRef.current;
    if (!signedOperation || isSettledRef.current) return;
    isSettledRef.current = true;
    onSuccess(signedOperation);
    onClose();
  }, [onSuccess, onClose]);

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
    deviceInitializationInput: signing?.deviceInitializationInput ?? null,
    signatureIntent: signing?.signatureIntent ?? null,
    onIntentJobStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  };
}
