import { useMemo } from "react";
import { createIntent } from "@features/platform-device-intent";
import type { AccountDataSignMessageParams } from "@features/platform-wallet-api-server";
import { signAccountMessageIntentLWDDefinition } from "../../deviceIntents/intentLWDDefinitions";
import { useSignRequestLifecycle } from "../../hooks/useSignRequestLifecycle";
import { decodeMessage } from "../../utils/decodeMessage";

export function useMessageSignViewModel(requestId: number, params: AccountDataSignMessageParams) {
  const lifecycle = useSignRequestLifecycle(requestId, params.account, params);
  const message = useMemo(() => decodeMessage(params.messageHex), [params.messageHex]);

  const { sign, onSuccess } = params;
  const intent = useMemo(
    () => createIntent(signAccountMessageIntentLWDDefinition, { sign }, { onResult: onSuccess }),
    [sign, onSuccess],
  );

  return {
    ...lifecycle,
    message,
    intent,
    canConfirm: lifecycle.initializationInput !== undefined,
  };
}
