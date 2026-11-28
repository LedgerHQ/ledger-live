import { useCallback, useMemo } from "react";
import invariant from "invariant";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import type {
  SignMessageIntentInput,
  SignMessageIntentJobState,
} from "@ledgerhq/live-common/intents/signMessageIntent";
import { WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import type { DeviceIntentTrackingProperties } from "@ledgerhq/live-dmk-shared";
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
import { signMessageIntentPlatformDefinition } from "./intentDefinition";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

type Props = Readonly<{
  request: WalletApiDeviceIntentSignMessageRequest;
  onClose: () => void;
}>;

export type MessageSignatureDrawerViewModel = UseDeviceIntentSignRequestResult<
  SignMessageIntentJobState,
  SignMessageIntentInput,
  undefined,
  string,
  InitializationInput
> &
  Readonly<{
    sourceFlow: SourceFlow;
    analyticsProperties: DeviceIntentTrackingProperties;
  }>;

function createMessageSignatureIntent(
  input: SignMessageIntentInput,
  onResult: (signature: string) => void,
) {
  return createIntent(signMessageIntentPlatformDefinition, input, { onResult });
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

export function useMessageSignatureDrawerViewModel({
  request,
  onClose,
}: Props): MessageSignatureDrawerViewModel {
  const prepare = useCallback(
    (currentRequest: WalletApiDeviceIntentSignMessageRequest) =>
      prepareMessageSignRequest(currentRequest),
    [],
  );

  const baseViewModel = useDeviceIntentSignRequest({
    request,
    prepare,
    createSignatureIntent: createMessageSignatureIntent,
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
    sourceFlow: getSignatureSourceFlow(request.manifestId, WC_ID),
    analyticsProperties,
    ...baseViewModel,
  };
}
