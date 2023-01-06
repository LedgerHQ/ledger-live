import { useCallback, useState } from "react";
import { NativeModules, Platform } from "react-native";

const { BluetoothHelperModule } = NativeModules;

const { E_BLE_CANCELLED } = BluetoothHelperModule;

type AndroidError = {
  code: string;
  message: string;
};

export enum BluetoothPromptResult {
  OK,
  UNAUTHORIZED,
}

/**
 * @returns a function that turns on bluetooth on the phone
 */
export function usePromptBluetoothCallback() {
  return useCallback(async (): Promise<number> => {
    try {
      const result = await NativeModules.BluetoothHelperModule.prompt();
      return parseInt(result, 10);
    } catch (e) {
      if (Platform.OS === "android") {
        const { code } = e as AndroidError;
        if (code === E_BLE_CANCELLED) {
          return BluetoothPromptResult.OK;
        }
      }
      // Technically there could be more errors, but the UI is either
      // going to show a BluetoothOff + retry, or a missing permission UI.
      return BluetoothPromptResult.UNAUTHORIZED;
    }
  }, []);
}

export function usePromptBluetoothCallbackWithState() {
  const [bluetoothPromptedOnce, setBluetoothPromptedOnce] = useState(false);
  const [bluetoothPromptResult, setBluetoothPromptResult] =
    useState<BluetoothPromptResult>(BluetoothPromptResult.OK);
  const promptBluetoothCallback = usePromptBluetoothCallback();

  const prompt = useCallback(() => {
    setBluetoothPromptedOnce(true);
    promptBluetoothCallback().then(result => {
      setBluetoothPromptResult(result);
    });
  }, [promptBluetoothCallback]);

  return {
    bluetoothPromptedOnce,
    bluetoothPromptResult,
    prompt,
  };
}
