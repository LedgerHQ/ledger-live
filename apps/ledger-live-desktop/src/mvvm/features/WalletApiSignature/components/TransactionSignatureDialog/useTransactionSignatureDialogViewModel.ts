import { useCallback, useMemo } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import type {
  SignTransactionIntentInput,
  SignTransactionIntentJobState,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignedOperation } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createIntent } from "@features/platform-device-intent";
import {
  useDeviceIntentSignRequest,
  type UseDeviceIntentSignRequestResult,
} from "@features/platform-wallet-api-sign";
import type { DeviceIntentTrackingProperties } from "@ledgerhq/live-dmk-shared";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import { signTransactionIntentLWDDefinition } from "./intentLWDDefinition";
import type {
  SignTransactionIntentComponentExtraProps,
  WalletApiDeviceIntentSignRequest,
} from "./types";

type Props = Readonly<{
  request: WalletApiDeviceIntentSignRequest;
  onClose: () => void;
}>;

export type TransactionSignatureDialogViewModel = UseDeviceIntentSignRequestResult<
  SignTransactionIntentJobState,
  SignTransactionIntentInput,
  SignTransactionIntentComponentExtraProps,
  InitializationInput
> &
  Readonly<{
    analyticsProperties: DeviceIntentTrackingProperties;
    intentComponentExtraProps: SignTransactionIntentComponentExtraProps;
  }>;

function createTransactionSignatureIntent(input: SignTransactionIntentInput) {
  return createIntent(signTransactionIntentLWDDefinition, input);
}

function getSignedResult(jobState: SignTransactionIntentJobState): SignedOperation | undefined {
  return jobState.type === "signed" ? jobState.signedOperation : undefined;
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

export function useTransactionSignatureDialogViewModel({
  request,
  onClose,
}: Props): TransactionSignatureDialogViewModel {
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
    getSignedResult,
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
    ...baseViewModel,
    analyticsProperties,
    intentComponentExtraProps,
  };
}
