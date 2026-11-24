import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
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
import { signTransactionIntentPlatformDefinition } from "./intentDefinition";
import type { WalletApiDeviceIntentSignRequest } from "./types";

type Props = {
  request: WalletApiDeviceIntentSignRequest;
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

export function useTransactionSignatureDrawerViewModel({ request, onClose }: Props) {
  const { account, parentAccount, transaction, appName, dependencies, onSuccess, onError } =
    request;

  const [deviceInitializationInput, setDeviceInitializationInput] =
    useState<InitializationInput | null>(null);
  // The wallet-api transaction is not fee-prepared (the legacy summary screen used to do
  // that). We prepare it here so gas/fees are estimated before signing directly on device,
  // which lets us skip the buffer screen. Provided fees (feesStrategy "custom") are kept.
  const [preparedTransaction, setPreparedTransaction] = useState<Transaction | null>(null);
  // The wallet-api promise is settled once: success, failure and dismiss race each other.
  const isSettledRef = useRef(false);
  // The failure of the last signing attempt, returned to the dApp when the user closes its
  // error screen. A retry starts a new attempt, whose job states clear it.
  const lastJobErrorRef = useRef<Error | null>(null);

  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;

  useEffect(() => {
    let cancelled = false;
    isSettledRef.current = false;
    lastJobErrorRef.current = null;
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
        if (cancelled || isSettledRef.current) return;
        isSettledRef.current = true;
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
        ? createIntent(signTransactionIntentPlatformDefinition, {
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
      lastJobErrorRef.current = null;
      if (jobState.type !== "signed" || isSettledRef.current) return;
      isSettledRef.current = true;
      onSuccess(jobState.signedOperation);
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

  // transaction.sign has no cancel channel: a dismiss without a failure is reported as
  // UserRefusedOnDevice, the conventional "user backed out" signal.
  const onUserCancel = useCallback(() => {
    if (isSettledRef.current) return;
    isSettledRef.current = true;
    onError(lastJobErrorRef.current ?? new UserRefusedOnDevice());
    onClose();
  }, [onError, onClose]);

  return {
    deviceInitializationInput,
    signatureIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onExecutorStateChanged,
    onUserCancel,
  };
}
