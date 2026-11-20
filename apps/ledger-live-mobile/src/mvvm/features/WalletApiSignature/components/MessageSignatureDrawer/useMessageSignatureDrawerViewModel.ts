import { useCallback } from "react";
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
import {
  buildDeviceInitializationInput,
  type InitializationInput,
  type SourceFlow,
} from "LLM/components/DeviceIntentExecutor";
import { signMessageIntentPlatformDefinition } from "./intentDefinition";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";
import { getSignatureSourceFlow } from "../../utils/getSignatureSourceFlow";

type Props = Readonly<{
  request: WalletApiDeviceIntentSignMessageRequest;
  onClose: () => void;
}>;

export type MessageSignatureDrawerViewModel = UseDeviceIntentSignRequestResult<
  SignMessageIntentJobState,
  SignMessageIntentInput,
  undefined,
  InitializationInput
> &
  Readonly<{
    sourceFlow: SourceFlow;
  }>;

function createMessageSignatureIntent(input: SignMessageIntentInput) {
  return createIntent(signMessageIntentPlatformDefinition, input);
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
    getSignedResult,
    onSuccess: request.onSuccess,
    onError: request.onError,
    onCancel: request.onCancel,
    onClose,
  });

  return {
    sourceFlow: getSignatureSourceFlow(request.manifestId),
    ...baseViewModel,
  };
}
