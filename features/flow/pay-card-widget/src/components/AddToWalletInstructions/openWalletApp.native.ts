import { Linking, NativeModules, Platform } from "react-native";

const GOOGLE_WALLET_STORE_URLS = [
  "market://details?id=com.google.android.apps.walletnfcrel",
  "https://play.google.com/store/apps/details?id=com.google.android.apps.walletnfcrel",
];

export async function openWalletApp(): Promise<boolean> {
  const openWallet = Platform.OS === "ios" ? openAppleWalletPaymentSetup : openGoogleWalletApp;

  try {
    await openWallet();
    return true;
  } catch (error) {
    console.warn("[pay-card] could not open the wallet app", error);
    return false;
  }
}

export async function openGoogleWalletStore(): Promise<boolean> {
  for (const url of GOOGLE_WALLET_STORE_URLS) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      continue;
    }
  }

  console.warn("[pay-card] could not open the Google Wallet store page");
  return false;
}

function openAppleWalletPaymentSetup(): Promise<void> {
  const module = NativeModules.AppleWalletModule as
    | { openPaymentSetup: () => Promise<void> }
    | undefined;
  return module?.openPaymentSetup() ?? Promise.reject(new Error("AppleWalletModule unavailable"));
}

function openGoogleWalletApp(): Promise<void> {
  const module = NativeModules.GoogleWalletModule as
    | { openWallet: () => Promise<void> }
    | undefined;
  return module?.openWallet() ?? Promise.reject(new Error("GoogleWalletModule unavailable"));
}
