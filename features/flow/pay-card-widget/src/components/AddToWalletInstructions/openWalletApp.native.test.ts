import { Linking, Platform } from "react-native";
import { openWalletApp } from "./openWalletApp";

describe("openWalletApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Linking.openURL).mockResolvedValue(undefined);
    jest.mocked(Linking.sendIntent).mockResolvedValue(undefined);
    jest.mocked(Linking.openSettings).mockResolvedValue(undefined);
    Platform.OS = "ios";
  });

  it("opens Apple Wallet on iOS", async () => {
    await openWalletApp();

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledWith("shoebox://");
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("tries the second Apple Wallet scheme when the first one is unhandled", async () => {
    jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error("unhandled scheme"));

    await openWalletApp();

    expect(Linking.openURL).toHaveBeenNthCalledWith(2, "wallet://");
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it("never sends an Android intent on iOS, where it is not implemented", async () => {
    jest.mocked(Linking.openURL).mockRejectedValue(new Error("unhandled scheme"));

    await openWalletApp();

    expect(Linking.sendIntent).not.toHaveBeenCalled();
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
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
    jest.mocked(Linking.openURL).mockRejectedValue(new Error("no wallet app"));
    jest.mocked(Linking.openSettings).mockRejectedValue(new Error("no settings"));

    await expect(openWalletApp()).resolves.toBeUndefined();
  });
});
