import { useCallback, useMemo } from "react";
import { createIntent } from "@features/platform-device-intent";
import type { VerifyAddressIntentJobState } from "@features/platform-verify-address-intent";
import type { AccountDataReceiveParams } from "@features/platform-wallet-api-server";
import { verifyReceiveAddressIntentLWDDefinition } from "../../deviceIntents/intentLWDDefinitions";
import { useSignRequestLifecycle } from "../../hooks/useSignRequestLifecycle";
import { buildReceiveVerificationInput } from "../../utils/buildReceiveVerificationInput";

/** A receive with a verification confirms it on the device; without one, the user confirms the address. */
export function useReceiveViewModel(requestId: number, params: AccountDataReceiveParams) {
  const { account, receive, onSuccess, onError } = params;
  const { verification } = receive;
  const lifecycle = useSignRequestLifecycle(requestId, account, params, verification !== undefined);
  const { close } = lifecycle;

  const intent = useMemo(
    () =>
      verification
        ? createIntent(
            verifyReceiveAddressIntentLWDDefinition,
            buildReceiveVerificationInput(account.entry, verification),
          )
        : undefined,
    [account.entry, verification],
  );

  const confirmWithoutDevice = useCallback(() => {
    onSuccess(receive.address);
    close();
  }, [onSuccess, receive.address, close]);

  const onIntentJobStateChanged = useCallback(
    (jobState: VerifyAddressIntentJobState) => {
      switch (jobState.type) {
        case "verified":
          onSuccess(receive.address);
          return close();
        case "mismatch":
          return onError(new Error("The address on the device does not match"));
        case "unsupported":
          return onError(jobState.error);
      }
    },
    [onSuccess, onError, receive.address, close],
  );

  return {
    ...lifecycle,
    address: receive.address,
    intent,
    confirm: intent ? lifecycle.confirm : confirmWithoutDevice,
    canConfirm: !intent || lifecycle.initializationInput !== undefined,
    onIntentJobStateChanged,
  };
}
