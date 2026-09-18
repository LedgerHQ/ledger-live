import { Linking, Platform } from "react-native";

/** `wallet://` is the current Apple Wallet scheme; `shoebox://` is the older one it replaced. */
const IOS_WALLET_URLS = ["wallet://", "shoebox://"];

/** Scheme registered by the Google Wallet app (`com.google.android.apps.walletnfcrel`). */
const ANDROID_WALLET_URLS = ["comgooglewallet://"];

/**
 * `Settings.ACTION_NFC_PAYMENT_SETTINGS` is "Contactless payments" (Android 14 and below) and
 * "Default wallet app" (Android 15+); `ACTION_NFC_SETTINGS` is the wider NFC screen it lives under.
 */
const ANDROID_WALLET_SETTINGS_ACTIONS = [
  "android.settings.NFC_PAYMENT_SETTINGS",
  "android.settings.NFC_SETTINGS",
];

/**
 * Sends the user to their phone's wallet so they can run the steps listed in the bottom sheet.
 *
 * Neither platform exposes a deep link into the "add a card" flow, so we open the wallet itself and
 * degrade to the closest system screen when that fails. Opening is attempted rather than probed
 * with `canOpenURL`, which would additionally require declaring every scheme in `Info.plist` /
 * `<queries>`. Never rejects: the sheet's written instructions are the fallback of last resort.
 */
export async function openWalletApp(): Promise<void> {
  const isIOS = Platform.OS === "ios";

  for (const url of isIOS ? IOS_WALLET_URLS : ANDROID_WALLET_URLS) {
    if (await didOpen(() => Linking.openURL(url))) return;
  }

  if (!isIOS) {
    for (const action of ANDROID_WALLET_SETTINGS_ACTIONS) {
      if (await didOpen(() => Linking.sendIntent(action))) return;
    }
  }

  await didOpen(() => Linking.openSettings());
}

async function didOpen(open: () => Promise<unknown>): Promise<boolean> {
  try {
    await open();
    return true;
  } catch {
    return false;
  }
}
