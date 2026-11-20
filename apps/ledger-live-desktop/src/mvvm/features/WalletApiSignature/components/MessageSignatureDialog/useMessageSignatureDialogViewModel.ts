import { useCallback, useMemo } from "react";
import invariant from "invariant";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import type {
  SignMessageIntentInput,
  SignMessageIntentJobState,
} from "@ledgerhq/live-common/intents/signMessageIntent";
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
import { signMessageIntentLWDDefinition } from "./intentLWDDefinition";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

type Props = Readonly<{
  request: WalletApiDeviceIntentSignMessageRequest;
  onClose: () => void;
}>;

export type MessageSignatureDialogViewModel = UseDeviceIntentSignRequestResult<
  SignMessageIntentJobState,
  SignMessageIntentInput,
  undefined,
  InitializationInput
> &
  Readonly<{
    analyticsProperties: DeviceIntentTrackingProperties;
  }>;

function createMessageSignatureIntent(input: SignMessageIntentInput) {
  return createIntent(signMessageIntentLWDDefinition, input);
}

function getSignedResult(jobState: SignMessageIntentJobState): string | undefined {
  return jobState.type === "signed" ? jobState.signature : undefined;
}

async function prepareMessageSignRequest(
  request: WalletApiDeviceIntentSignMessageRequest,
): Promise<{
  deviceInitializationInput: InitializationInput;
  intentInput: SignMessageIntentInput;
}> {
  const { account, parentAccount, message, appName, dependencies } = request;
  invariant(account.type === "Account", "walletApiSignMessage: expected a main account");
  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const deviceInitializationInput = await buildDeviceInitializationInput({
    appRequest: {
      account: mainAccount,
      appName,
      dependencies: dependenciesToAppRequests(dependencies),
    },
    flow: FlowName.unknown,
  });

  return {
    deviceInitializationInput,
    intentInput: {
      account,
      parentAccount: parentAccount ?? undefined,
      message,
    },
  };
}

export function useMessageSignatureDialogViewModel({
  request,
  onClose,
}: Props): MessageSignatureDialogViewModel {
  const prepare = useCallback(
    (currentRequest: WalletApiDeviceIntentSignMessageRequest) =>
      prepareMessageSignRequest(currentRequest),
    [],
  );

  const baseViewModel = useDeviceIntentSignRequest({
    request,
    prepare,
    createSignatureIntent: createMessageSignatureIntent,
    getSignedResult,
    onSuccess: request.onSuccess,
    onError: request.onError,
    onCancel: request.onCancel,
    onClose,
  });

  const analyticsProperties = useMemo<DeviceIntentTrackingProperties>(
    () => ({ manifestId: request.manifestId, manifestName: request.manifestName }),
    [request.manifestId, request.manifestName],
  );

  return {
    ...baseViewModel,
    analyticsProperties,
  };
}
