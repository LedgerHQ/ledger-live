import { Linking, NativeModules, Platform } from "react-native";
import { openGoogleWalletStore, openWalletApp } from "./openWalletApp";

const originalAppleWalletModule = NativeModules.AppleWalletModule;
const originalGoogleWalletModule = NativeModules.GoogleWalletModule;
const mockOpenPaymentSetup = jest.fn<Promise<void>, []>();
const mockOpenWallet = jest.fn<Promise<void>, []>();

describe("openWalletApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenPaymentSetup.mockResolvedValue(undefined);
    mockOpenWallet.mockResolvedValue(undefined);
    jest.mocked(Linking.openURL).mockResolvedValue(undefined);
    NativeModules.AppleWalletModule = { openPaymentSetup: mockOpenPaymentSetup };
    NativeModules.GoogleWalletModule = { openWallet: mockOpenWallet };
    Platform.OS = "ios";
  });

  afterAll(() => {
    NativeModules.AppleWalletModule = originalAppleWalletModule;
    NativeModules.GoogleWalletModule = originalGoogleWalletModule;
  });

  it("opens Apple Wallet payment setup on iOS", async () => {
    await expect(openWalletApp()).resolves.toBe(true);

    expect(mockOpenPaymentSetup).toHaveBeenCalledTimes(1);
    expect(mockOpenWallet).not.toHaveBeenCalled();
  });

  it("reports failure when Apple Pay is unavailable", async () => {
    mockOpenPaymentSetup.mockRejectedValueOnce(new Error("Apple Pay unavailable"));

    await expect(openWalletApp()).resolves.toBe(false);
  });

  it("reports failure when the iOS native bridge is unavailable", async () => {
    NativeModules.AppleWalletModule = undefined;

    await expect(openWalletApp()).resolves.toBe(false);
  });

  it("opens Google Wallet on Android", async () => {
    Platform.OS = "android";

    await expect(openWalletApp()).resolves.toBe(true);

    expect(mockOpenWallet).toHaveBeenCalledTimes(1);
    expect(mockOpenPaymentSetup).not.toHaveBeenCalled();
  });

  it("reports failure when Google Wallet is unavailable", async () => {
    Platform.OS = "android";
    mockOpenWallet.mockRejectedValue(new Error("Google Wallet is not installed or is disabled"));

    await expect(openWalletApp()).resolves.toBe(false);
  });

  it("opens the Google Wallet Play Store page", async () => {
    await expect(openGoogleWalletStore()).resolves.toBe(true);

    expect(Linking.openURL).toHaveBeenCalledWith(
      "market://details?id=com.google.android.apps.walletnfcrel",
    );
  });

  it("falls back to the web Play Store page", async () => {
    jest
      .mocked(Linking.openURL)
      .mockRejectedValueOnce(new Error("Play Store unavailable"))
      .mockResolvedValueOnce(undefined);

    await expect(openGoogleWalletStore()).resolves.toBe(true);

    expect(Linking.openURL).toHaveBeenNthCalledWith(
      2,
      "https://play.google.com/store/apps/details?id=com.google.android.apps.walletnfcrel",
    );
  });

  it("reports failure when the Google Wallet store page cannot be opened", async () => {
    jest.mocked(Linking.openURL).mockRejectedValue(new Error("No URL handler"));

    await expect(openGoogleWalletStore()).resolves.toBe(false);
  });

  it("resolves instead of throwing when every entry point fails", async () => {
    mockOpenPaymentSetup.mockRejectedValue(new Error("Apple Pay unavailable"));

    await expect(openWalletApp()).resolves.toBe(false);
  });
});
