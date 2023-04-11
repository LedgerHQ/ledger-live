import { useCallback, useEffect, useState } from "react";
import { Observable, Subscription } from "rxjs";
import { NativeModules, Platform } from "react-native";
import Config from "react-native-config";
import TransportBLE from "../../../react-native-hw-transport-ble";

const { BluetoothHelperModule } = NativeModules;

const { E_BLE_CANCELLED } = BluetoothHelperModule;

type AndroidError = {
  code: string;
  message: string;
};

export enum BluetoothPromptResult {
  BLE_UNKNOWN_STATE = "BLE_UNKNOWN_STATE",
  BLE_CAN_BE_ENABLED = "BLE_CAN_BE_ENABLED",
  BLE_CANNOT_BE_ENABLED = "BLE_CANNOT_BE_ENABLED",
}

/**
 * Hook returning a callback that checks the bluetooth services state and requests (if necessary) the user to enable them
 *
 * Works for both iOS and Android.
 * But on iOS the prompt will return an undefined value, which will result in a BLE_UNKNOWN_STATE.
 *
 * If you want to enable the bluetooth services directly and/or keep track of the bluetooth services state,
 * use useEnableBluetooth defined below.
 */
export function usePromptEnableBluetoothCallback() {
  return useCallback(async (): Promise<BluetoothPromptResult> => {
    try {
      const result = await NativeModules.BluetoothHelperModule.prompt();

      if (result === undefined) {
        return BluetoothPromptResult.BLE_UNKNOWN_STATE;
      }

      const resultAsInt = parseInt(result, 10);
      if (resultAsInt === 1) {
        return BluetoothPromptResult.BLE_CAN_BE_ENABLED;
      }
      return BluetoothPromptResult.BLE_CANNOT_BE_ENABLED;
    } catch (e) {
      if (Platform.OS === "android") {
        const { code } = e as AndroidError;
        if (code === E_BLE_CANCELLED) {
          // The user cancelled the prompt, but bluetooth has enough permissions,
          // and did not encounter any other errors, to be enabled.
          return BluetoothPromptResult.BLE_CAN_BE_ENABLED;
        }
      }
      // Technically there could be more errors. But the consumer is either
      // going to display a bluetooth-is-off + retry UI, or a missing BLE permission UI.
      return BluetoothPromptResult.BLE_CANNOT_BE_ENABLED;
    }
  }, []);
}

export type BluetoothServicesState =
  | "unknown"
  | "enabled"
  | "disabled"
  | "unauthorized";

export type UseEnableBluetoothArgs = {
  isHookEnabled?: boolean;
};

/**
 * Hook to enable the bluetooth services
 *
 * A method is exposed to check the bluetooth services state and request (if necessary) the user to enable it.
 * This method is called a first time on mount.
 * It also listens to an update of the bluetooth services state from BleTransport, and updates the state accordingly.
 *
 * It can also indicate if bluetooth has enough permissions to be enabled.
 * Useful for iOS as we don't have an easy way to implement a useIosBluetoothPermissions currently.
 *
 * Works for both iOS and Android.
 *
 * Not Transport agnostic. It uses @ledgerhq/react-native-hw-transport-ble.
 *
 * @param isHookEnabled if false, the hook will not check/request the bluetooth services, and will not listen to the
 *   the bluetooth services state from BleTransport. Defaults to true.
 *
 * @returns an object containing:
 * - checkAndRequestAgain: a function that checks the bluetooth services state and requests (if necessary) the user to enable it
 * - bluetoothServicesState: a state that indicates if bluetooth is enabled or not
 */
export function useEnableBluetooth(
  { isHookEnabled = true }: UseEnableBluetoothArgs = {
    isHookEnabled: true,
  },
) {
  const [observedTransportState, setObservedTransportState] =
    useState<string>("Unknown");

  const promptBluetoothCallback = usePromptEnableBluetoothCallback();

  // Exposes a check and request enabling bluetooth services again (if needed)
  const checkAndRequestAgain = useCallback(async () => {
    // Early return when mocking, because when running LLM in an iOS simulator
    // prompting the user to enable bluetooth services will randomly crash the app
    if (!isHookEnabled || Config.MOCK) return;

    // We actually can't do anything with the result, as on iOS it will always be BLE_UNKNOWN_STATE
    await promptBluetoothCallback();
  }, [isHookEnabled, promptBluetoothCallback]);

  // Checks and requests on mount
  useEffect(() => {
    if (!isHookEnabled) return;

    checkAndRequestAgain();
  }, [checkAndRequestAgain, isHookEnabled]);

  // Not Transport agnostic.
  // To be Transport agnostic: a re-write of the native module for both iOS and Android is needed,
  // so it would emit events on bluetooth services changes
  // Observes the bluetooth state (if powered on or not)
  useEffect(() => {
    let sub: null | Subscription;

    if (isHookEnabled) {
      sub = new Observable(TransportBLE.observeState).subscribe({
        next: ({ type }: { type: string }) => setObservedTransportState(type),
      });
    }
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [isHookEnabled]);

  let bluetoothServicesState: BluetoothServicesState = "disabled";

  if (observedTransportState === "PoweredOn") {
    bluetoothServicesState = "enabled";
  } else if (observedTransportState === "PoweredOff") {
    bluetoothServicesState = "disabled";
  } else if (observedTransportState === "Unauthorized") {
    bluetoothServicesState = "unauthorized";
  } else if (observedTransportState === "Unknown") {
    bluetoothServicesState = "unknown";
  }

  return {
    checkAndRequestAgain,
    bluetoothServicesState,
  };
}
