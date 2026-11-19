import { useEffect, useRef, useState } from "react";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  VerifyAddressIntent,
  VerifyAddressIntentResult,
} from "@features/platform-intent-verify-address";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { prepareVerifyAddress, type PreparedVerifyAddress } from "../logic/prepareVerifyAddress";
import type {
  VerifyAddressAccount,
  VerifyAddressDeviceFlowFailure,
  VerifyAddressExecutorPorts,
  VerifyAddressOutcome,
  VerifyAddressSelection,
  VerifyAddressTracking,
} from "../types";
import { useVerifyAddressSession } from "./useVerifyAddressSession";

export type UseVerifyAddressExecutorViewModelParams = Readonly<{
  selection: VerifyAddressSelection;
  onExit: (outcome: VerifyAddressOutcome) => void;
  /** Read once, when the verification starts. */
  unsupportedDeviceModelIds?: readonly DeviceModelId[];
}>;

/** What the app's `DeviceIntentExecutor` takes for the verification. */
export type VerifyAddressExecutorViewModel<InitInput> = Readonly<{
  deviceConnectionParams: DeviceConnectionParams;
  deviceInitializationInput: InitInput;
  intent: VerifyAddressIntent<undefined, VerifyAddressIntentResult>;
  intentComponentExtraProps: undefined;
  analyticsProperties: VerifyAddressTracking;
  onIntentJobError: () => void;
  onUserCancel: (failure: VerifyAddressDeviceFlowFailure | null) => void;
}>;

/**
 * Prepares the device verification of the selected address. `null` until it can mount; the
 * verification exits through `onExit` when it cannot start.
 */
export function useVerifyAddressExecutorViewModel<
  Account extends VerifyAddressAccount,
  Token extends { ticker: string },
  Options,
  InitInput,
>(
  { selection, onExit, unsupportedDeviceModelIds }: UseVerifyAddressExecutorViewModelParams,
  ports: VerifyAddressExecutorPorts<Account, Token, Options, InitInput>,
): VerifyAddressExecutorViewModel<InitInput> | null {
  const [initialUnsupportedDeviceModelIds] = useState(unsupportedDeviceModelIds);
  const [prepared, setPrepared] = useState<PreparedVerifyAddress<InitInput> | null>(null);
  const portsRef = useRef(ports);
  const { exitEarly, onAttemptStart, onResult, onJobError, onUserCancel } = useVerifyAddressSession(
    {
      tracking: prepared?.tracking,
      onExit,
    },
  );

  useEffect(() => {
    portsRef.current = ports;
  }, [ports]);

  useEffect(() => {
    const currentPorts = portsRef.current;
    const account = currentPorts.getAccount(selection.accountUUID);
    if (!account) {
      exitEarly("failed");
      return;
    }

    let unmounted = false;
    prepareVerifyAddress(
      account,
      selection,
      initialUnsupportedDeviceModelIds,
      { onResult, onAttemptStart },
      currentPorts,
    ).then(
      preparation => {
        if (unmounted) return;
        if (preparation.type === "exit") exitEarly(preparation.outcome, preparation.tracking);
        else setPrepared(preparation.prepared);
      },
      () => {
        if (!unmounted) exitEarly("failed");
      },
    );
    return () => {
      unmounted = true;
    };
  }, [selection, initialUnsupportedDeviceModelIds, exitEarly, onAttemptStart, onResult]);

  if (!prepared) return null;

  return {
    deviceConnectionParams: prepared.deviceConnectionParams,
    deviceInitializationInput: prepared.deviceInitializationInput,
    intent: prepared.intent,
    intentComponentExtraProps: undefined,
    analyticsProperties: prepared.tracking,
    onIntentJobError: onJobError,
    onUserCancel,
  };
}
