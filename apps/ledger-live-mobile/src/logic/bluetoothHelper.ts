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

export async function promptBluetooth(silent = false) {
  try {
    const res = await NativeModules.BluetoothHelperModule.prompt();
    return res;
  } catch (e) {
    console.error(e);
    if (Platform.OS === "android") {
      const androidError = e as AndroidError;
      const { code, message, userInfo } = androidError;
      // console.log({ code, message, userInfo });
      // TODO: we need a proper UX for handling these errors, this is just the error filtering logic
      switch (code) {
        case E_BLE_PERMISSIONS_DENIED:
          if (!silent)
            Alert.alert(
              "Permissions denied",
              JSON.stringify(userInfo?.permissionsDenied, null, 2),
              [
                { text: "Cancel" },
                {
                  text: "Open settings",
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          break;
        case E_BLE_CANCELLED:
          if (!silent)
            Alert.alert(
              "Enabling bluetooth error",
              "Bluetooth was not turned on",
            );
          break;
        case E_ACTIVITY_DOES_NOT_EXIST:
          if (!silent)
            Alert.alert("Enabling bluetooth error", "Activity does not exist");
          break;
        case E_SECURITY_EXCEPTION:
          if (!silent)
            Alert.alert("Enabling bluetooth error", "Security exception");
          break;
        case E_UNKNOWN_ERROR:
        default:
          if (!silent) Alert.alert("Enabling bluetooth error", "Unknown error");
      }
    }
    throw e;
  }
}
