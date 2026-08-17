jest.mock("react-native-keychain", () => ({
  ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: "biometryAnyOrDevicePasscode" },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly" },
  getSupportedBiometryType: jest.fn(),
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  hasGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

import {
  armBiometricPrompt,
  disarmBiometricPrompt,
  getBiometricsAvailability,
  hasArmedBiometricPrompt,
  promptBiometrics,
} from "./biometrics";

const keychain = jest.requireMock("react-native-keychain");

beforeEach(() => jest.clearAllMocks());

describe("getBiometricsAvailability", () => {
  it("reports what the device supports", async () => {
    keychain.getSupportedBiometryType.mockResolvedValue("FaceID");

    await expect(getBiometricsAvailability()).resolves.toEqual({
      status: "available",
      kind: "FaceID",
    });
  });

  it("reports unavailable when the device answers nothing", async () => {
    keychain.getSupportedBiometryType.mockResolvedValue(null);

    await expect(getBiometricsAvailability()).resolves.toEqual({ status: "unavailable" });
  });
});

describe("promptBiometrics", () => {
  it("succeeds when the canary can be read", async () => {
    keychain.getGenericPassword.mockResolvedValue({ password: "armed" });

    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "succeeded" });
    expect(keychain.getGenericPassword).toHaveBeenCalledWith(
      expect.objectContaining({ authenticationPrompt: { title: "Unlock" } }),
    );
  });

  it("fails when the canary is gone", async () => {
    keychain.getGenericPassword.mockResolvedValue(false);

    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "failed" });
  });

  it("tells a refusal apart from a dismissal", async () => {
    keychain.getGenericPassword.mockRejectedValueOnce({ code: -128, message: "canceled" });
    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "cancelled" });

    keychain.getGenericPassword.mockRejectedValueOnce(new Error("Authentication failed"));
    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "failed" });

    keychain.getGenericPassword.mockRejectedValueOnce(new Error("Too many attempts"));
    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "lockedOut" });
  });
});

describe("the armed prompt", () => {
  it("arms behind biometrics or the device passcode", async () => {
    keychain.setGenericPassword.mockResolvedValue({ service: "canary" });

    await expect(armBiometricPrompt()).resolves.toBe(true);
    expect(keychain.setGenericPassword).toHaveBeenCalledWith(
      "app-lock",
      "armed",
      expect.objectContaining({ accessControl: "biometryAnyOrDevicePasscode" }),
    );
  });

  it("reports arming that the keychain refused", async () => {
    keychain.setGenericPassword.mockResolvedValue(false);

    await expect(armBiometricPrompt()).resolves.toBe(false);
  });

  it("reads back whether it is armed, since protection state is not persisted", async () => {
    keychain.hasGenericPassword.mockResolvedValue(true);

    await expect(hasArmedBiometricPrompt()).resolves.toBe(true);
  });

  it("disarms by destroying the canary", async () => {
    keychain.resetGenericPassword.mockResolvedValue(true);

    await disarmBiometricPrompt();

    expect(keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: "com.ledger.live.appLock.biometricCanary",
    });
  });
});
