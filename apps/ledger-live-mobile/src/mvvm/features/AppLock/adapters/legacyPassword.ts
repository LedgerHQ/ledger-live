import { Platform } from "react-native";
import * as Keychain from "react-native-keychain";

const legacyOptions: Keychain.GetOptions =
  Platform.OS === "ios" ? {} : { accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD };

export async function readLegacyPassword(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword(legacyOptions);

    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
}

export async function clearLegacyPassword(): Promise<void> {
  await Keychain.resetGenericPassword();
}
