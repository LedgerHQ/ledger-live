import { Linking, NativeModules, Platform } from "react-native";

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
 * Opens the platform's payment-card setup, reporting whether an entry point could be reached so the
 * caller can leave the written instructions on screen when none could. Never rejects.
 */
export async function openWalletApp(): Promise<boolean> {
  const opened =
    Platform.OS === "ios" ? await openApplePaymentSetup() : await openGoogleWalletSetup();

  if (!opened) {
    console.warn("[pay-card] no wallet setup entry point could be opened");
  }

  return opened;
}

function openApplePaymentSetup(): Promise<boolean> {
  return didOpen(openAppleWalletPaymentSetup);
}

async function openGoogleWalletSetup(): Promise<boolean> {
  for (const url of ANDROID_WALLET_URLS) {
    if (await didOpen(() => Linking.openURL(url))) return true;
  }

  for (const action of ANDROID_WALLET_SETTINGS_ACTIONS) {
    if (await didOpen(() => Linking.sendIntent(action))) return true;
  }

  return didOpen(() => Linking.openSettings());
}

function openAppleWalletPaymentSetup(): Promise<void> {
  const module = NativeModules.AppleWalletModule as
    | { openPaymentSetup: () => Promise<void> }
    | undefined;
  return module?.openPaymentSetup() ?? Promise.reject(new Error("AppleWalletModule unavailable"));
}

async function didOpen(open: () => Promise<unknown>): Promise<boolean> {
  try {
    await open();
    return true;
  } catch {
    return false;
  }
}
