import {
  Alert,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

const { BluetoothHelperModule } = NativeModules;

const {
  E_ACTIVITY_DOES_NOT_EXIST,
  E_BLE_CANCELLED,
  E_BLE_PERMISSIONS_DENIED,
  E_SECURITY_EXCEPTION,
  E_UNKNOWN_ERROR,
} = BluetoothHelperModule;

type AndroidError = {
  code: string;
  message: string;
  userInfo: any;
};

/**
 * Turns on bluetooth on the phone and requests the permissions to do so if
 * needed.
 * @returns true if bluetooth has been turned on, false otherwise.
 */
export async function promptBluetooth(): Promise<boolean> {
  try {
    return NativeModules.BluetoothHelperModule.prompt();
  } catch (e) {
    console.error(e);
    if (Platform.OS === "android") {
      const { code } = e as AndroidError;
      switch (code) {
        case E_BLE_PERMISSIONS_DENIED: // in case the user denied the permissions
          Alert.alert(
            // TODO: get the correct wording & add to en/common.json
            // TODO: we need a proper UX for handling this case
            "Permission denied",
            'Open the app\'s settings, go to permissions and enable "Nearby devices"',
            [
              { text: "Cancel" },
              {
                text: "Open settings",
                onPress: () => Linking.openSettings(),
              },
            ],
          );
          return false;
        case E_BLE_CANCELLED: // in case the user didn't turn bluetooth on
          return false;
        case E_ACTIVITY_DOES_NOT_EXIST:
        case E_SECURITY_EXCEPTION:
        case E_UNKNOWN_ERROR:
        default:
      }
    }
    throw e;
  }
}
