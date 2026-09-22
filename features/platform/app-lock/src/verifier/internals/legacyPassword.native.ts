import * as Keychain from "react-native-keychain";

function readOptions(platform: string): Keychain.GetOptions {
  return platform === "ios" ? {} : { accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD };
}

export async function readLegacyPassword(platform: string): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword(readOptions(platform));

    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
}

// No access control, so asking costs no prompt. An error counts as present: dropping the lock over
// an entry that is still there would abandon the plaintext with nothing left to delete it.
export async function hasLegacyPassword(): Promise<boolean> {
  try {
    return await Keychain.hasGenericPassword();
  } catch {
    return true;
  }
}

export async function clearLegacyPassword(): Promise<boolean> {
  return Keychain.resetGenericPassword();
}
