import { useCallback, useMemo } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import type {
  SignTransactionIntentInput,
  SignTransactionIntentJobState,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import { WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import type { DeviceIntentTrackingProperties } from "@ledgerhq/live-dmk-shared";
import type { SignedOperation } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createIntent } from "@features/platform-device-intent";
import {
  getSignatureSourceFlow,
  useDeviceIntentSignRequest,
  type UseDeviceIntentSignRequestResult,
} from "@features/platform-wallet-api-sign";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
  type SourceFlow,
} from "LLM/components/DeviceIntentExecutor";
import { signTransactionIntentPlatformDefinition } from "./intentDefinition";
import type {
  SignTransactionIntentComponentExtraProps,
  WalletApiDeviceIntentSignRequest,
} from "./types";

type Props = Readonly<{
  request: WalletApiDeviceIntentSignRequest;
  onClose: () => void;
}>;

export type TransactionSignatureDrawerViewModel = UseDeviceIntentSignRequestResult<
  SignTransactionIntentJobState,
  SignTransactionIntentInput,
  SignTransactionIntentComponentExtraProps,
  SignedOperation,
  InitializationInput
> &
  Readonly<{
    sourceFlow: SourceFlow;
    analyticsProperties: DeviceIntentTrackingProperties;
    intentComponentExtraProps: SignTransactionIntentComponentExtraProps;
  }>;

function createTransactionSignatureIntent(
  input: SignTransactionIntentInput,
  onResult: (signedOperation: SignedOperation) => void,
) {
  return createIntent(signTransactionIntentPlatformDefinition, input, { onResult });
}

async function prepareTransactionSignRequest(request: WalletApiDeviceIntentSignRequest): Promise<{
  deviceInitializationInput: InitializationInput;
  intentInput: SignTransactionIntentInput;
}> {
  const { account, parentAccount, transaction, appName, dependencies } = request;
  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const tokenCurrency = account.type === "TokenAccount" ? account.token : undefined;
  const bridge = await getAccountBridge(mainAccount);
  const [preparedTransaction, deviceInitializationInput] = await Promise.all([
    bridge.prepareTransaction(mainAccount, transaction),
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

  return {
    deviceInitializationInput,
    intentInput: {
      account,
      parentAccount: parentAccount ?? undefined,
      transaction: preparedTransaction,
      tokenCurrency,
    },
  };
}

export function useTransactionSignatureDrawerViewModel({
  request,
  onClose,
}: Props): TransactionSignatureDrawerViewModel {
  const prepare = useCallback(
    (currentRequest: WalletApiDeviceIntentSignRequest) =>
      prepareTransactionSignRequest(currentRequest),
    [],
  );

  // transaction.sign has no cancel channel: a dismissed request maps to UserRefusedOnDevice.
  const onCancel = useCallback(() => {
    request.onError(new UserRefusedOnDevice());
  }, [request]);

  const baseViewModel = useDeviceIntentSignRequest({
    request,
    prepare,
    createSignatureIntent: createTransactionSignatureIntent,
    onSuccess: request.onSuccess,
    onError: request.onError,
    onCancel,
    onClose,
  });

  const analyticsProperties = useMemo<DeviceIntentTrackingProperties>(
    () => ({ manifestId: request.manifestId, manifestName: request.manifestName }),
    [request.manifestId, request.manifestName],
  );

  const intentComponentExtraProps = useMemo<SignTransactionIntentComponentExtraProps>(
    () => ({
      manifestId: request.manifestId,
      manifestName: request.manifestName,
      recipient: request.transaction.recipient,
    }),
    [request.manifestId, request.manifestName, request.transaction.recipient],
  );

  return {
    sourceFlow: getSignatureSourceFlow(request.manifestId, WC_ID),
    analyticsProperties,
    intentComponentExtraProps,
    ...baseViewModel,
  };
}
