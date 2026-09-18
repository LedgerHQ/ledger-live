import { Linking, NativeModules, Platform } from "react-native";
import { openWalletApp } from "./openWalletApp";

const originalAppleWalletModule = NativeModules.AppleWalletModule;
const mockOpenPaymentSetup = jest.fn<Promise<void>, []>();

describe("openWalletApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenPaymentSetup.mockResolvedValue(undefined);
    NativeModules.AppleWalletModule = { openPaymentSetup: mockOpenPaymentSetup };
    jest.mocked(Linking.openURL).mockResolvedValue(undefined);
    jest.mocked(Linking.sendIntent).mockResolvedValue(undefined);
    jest.mocked(Linking.openSettings).mockResolvedValue(undefined);
    Platform.OS = "ios";
  });

  afterAll(() => {
    NativeModules.AppleWalletModule = originalAppleWalletModule;
  });

  it("opens Apple Wallet payment setup on iOS", async () => {
    await expect(openWalletApp()).resolves.toBe(true);

    expect(mockOpenPaymentSetup).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("reports failure without opening unrelated settings when Apple Pay is unavailable", async () => {
    mockOpenPaymentSetup.mockRejectedValueOnce(new Error("Apple Pay unavailable"));

    await expect(openWalletApp()).resolves.toBe(false);

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("reports failure when the native bridge is unavailable", async () => {
    NativeModules.AppleWalletModule = undefined;

    await expect(openWalletApp()).resolves.toBe(false);

    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("never sends an Android intent on iOS, where it is not implemented", async () => {
    mockOpenPaymentSetup.mockRejectedValue(new Error("Apple Pay unavailable"));

    await openWalletApp();

    expect(Linking.sendIntent).not.toHaveBeenCalled();
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("opens Google Wallet on Android", async () => {
    Platform.OS = "android";

    await openWalletApp();

    expect(Linking.openURL).toHaveBeenCalledWith("comgooglewallet://");
    expect(Linking.sendIntent).not.toHaveBeenCalled();
  });

  it("falls back to the contactless payment settings when Google Wallet is not installed", async () => {
    Platform.OS = "android";
    jest.mocked(Linking.openURL).mockRejectedValue(new Error("no wallet app"));

    await openWalletApp();

    expect(Linking.sendIntent).toHaveBeenCalledTimes(1);
    expect(Linking.sendIntent).toHaveBeenCalledWith("android.settings.NFC_PAYMENT_SETTINGS");
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("falls back to the NFC settings when the phone has no contactless payment screen", async () => {
    Platform.OS = "android";
    jest.mocked(Linking.openURL).mockRejectedValue(new Error("no wallet app"));
    jest.mocked(Linking.sendIntent).mockRejectedValueOnce(new Error("no such activity"));

    await openWalletApp();

    expect(Linking.sendIntent).toHaveBeenNthCalledWith(2, "android.settings.NFC_SETTINGS");
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("resolves instead of throwing when every entry point fails", async () => {
    mockOpenPaymentSetup.mockRejectedValue(new Error("Apple Pay unavailable"));
    jest.mocked(Linking.openSettings).mockRejectedValue(new Error("no settings"));

    await expect(openWalletApp()).resolves.toBe(false);
  });
});
