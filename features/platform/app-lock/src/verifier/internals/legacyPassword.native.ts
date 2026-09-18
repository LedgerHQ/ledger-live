import * as Keychain from "react-native-keychain";

// The platform arrives as an argument, as it does for `isAppBackgrounded`: this package stays clear
// of react-native so it can be tested in node.
function readOptions(platform: string): Keychain.GetOptions {
  return platform === "ios" ? {} : { accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD };
}

// Unreadable counts as absent: the migration then leaves the legacy entry alone, and the user keeps
// getting in through it. Throwing would strand them on a screen that cannot help.
export async function readLegacyPassword(platform: string): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword(readOptions(platform));

    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
}

export async function clearLegacyPassword(): Promise<void> {
  await Keychain.resetGenericPassword();
}
