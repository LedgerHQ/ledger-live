import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NativeModules, Platform, ToastAndroid } from "react-native";

const { BluetoothHelperModule } = NativeModules;

const {
  E_ACTIVITY_DOES_NOT_EXIST,
  E_BLE_CANCELLED,
  E_ENABLE_BLE_UNKNOWN_RESPONSE,
  E_SECURITY_EXCEPTION,
  E_UNKNOWN_ERROR,
} = BluetoothHelperModule;

type AndroidError = {
  code: string;
  message: string;
};

/**
 * @returns a function that turns on bluetooth on the phone
 */
export function usePromptBluetoothCallback() {
  const { t } = useTranslation();
  return useCallback(async (): Promise<boolean> => {
    try {
      return await NativeModules.BluetoothHelperModule.prompt();
    } catch (e) {
      console.error(e);
      if (Platform.OS === "android") {
        const { code } = e as AndroidError;
        switch (code) {
          case E_BLE_CANCELLED: // in case the user didn't turn bluetooth on
          case E_ACTIVITY_DOES_NOT_EXIST:
          case E_ENABLE_BLE_UNKNOWN_RESPONSE:
          case E_SECURITY_EXCEPTION:
          case E_UNKNOWN_ERROR:
          default:
            ToastAndroid.show(
              t("errors.BluetoothRequired.description"),
              ToastAndroid.LONG,
            );
        }
      }
      throw e;
    }
  }, [t]);
}

export function usePromptBluetoothCallbackWithState() {
  const [bluetoothPromptedOnce, setBluetoothPromptedOnce] = useState(false);
  const [bluetoothPromptSucceeded, setBluetoothPromptSucceeded] =
    useState(true);
  const promptBluetoothCallback = usePromptBluetoothCallback();

  const prompt = useCallback(() => {
    setBluetoothPromptedOnce(true);
    promptBluetoothCallback()
      .then(
        res =>
          setBluetoothPromptSucceeded(Platform.OS === "android" ? !!res : true), // on iOS we don't have the actual result so we use an optimistic approach
      )
      .catch(() => setBluetoothPromptSucceeded(false));
  }, [promptBluetoothCallback]);
  return {
    bluetoothPromptedOnce,
    bluetoothPromptSucceeded,
    prompt,
  };
}
