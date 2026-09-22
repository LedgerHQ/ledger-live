const simplePrompt = jest.fn();

jest.mock("react-native-biometrics", () => ({
  __esModule: true,
  default: jest.fn(() => ({ simplePrompt })),
}));

import ReactNativeBiometrics from "react-native-biometrics";

jest.mock("react-native-keychain", () => ({
  ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: "biometryAnyOrDevicePasscode" },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly" },
  getSupportedBiometryType: jest.fn(),
  getGenericPassword: jest.fn(),
  hasGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

import {
  storeBiometricsMarker,
  clearBiometricsMarker,
  hasBiometricsMarker,
  getBiometricsAvailability,
  promptBiometrics,
} from "./biometrics.native";

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
  const labels = { reason: "Unlock", fallback: "Use PIN", cancel: "Cancel" };

  // `allowDeviceCredentials` is what makes Android draw its own "use PIN" button.
  it("asks the OS, accepting the device credential as a fallback", async () => {
    simplePrompt.mockResolvedValue({ success: true });

    await expect(promptBiometrics(labels)).resolves.toEqual({ status: "succeeded" });
    expect(ReactNativeBiometrics).toHaveBeenCalledWith({ allowDeviceCredentials: true });
    expect(simplePrompt).toHaveBeenCalledWith({
      promptMessage: "Unlock",
      fallbackPromptMessage: "Use PIN",
      cancelButtonText: "Cancel",
    });
  });

  it("fails when the owner does not pass it", async () => {
    simplePrompt.mockResolvedValue({ success: false, error: "Authentication failed" });

    await expect(promptBiometrics(labels)).resolves.toEqual({ status: "failed" });
  });

  it("tells a dismissal and a lockout apart from a plain refusal", async () => {
    simplePrompt.mockResolvedValue({ success: false, error: "User cancelled" });
    await expect(promptBiometrics(labels)).resolves.toEqual({ status: "cancelled" });

    simplePrompt.mockResolvedValue({ success: false, error: "Too many attempts" });
    await expect(promptBiometrics(labels)).resolves.toEqual({ status: "lockedOut" });
  });

  it("survives a prompt that throws rather than answering", async () => {
    simplePrompt.mockRejectedValue(new Error("Authentication failed"));

    await expect(promptBiometrics(labels)).resolves.toEqual({ status: "failed" });
  });
});

describe("the biometrics marker", () => {
  it("is stored without an access control", async () => {
    keychain.setGenericPassword.mockResolvedValue({ service: "marker" });

    await expect(storeBiometricsMarker()).resolves.toBe(true);

    const [, , options] = keychain.setGenericPassword.mock.calls[0];
    expect(options.accessControl).toBeUndefined();
    expect(options.service).toBe("com.ledger.live.appLock.biometricCanary");
  });

  it("reports a keychain that refused to store it", async () => {
    keychain.setGenericPassword.mockResolvedValue(false);

    await expect(storeBiometricsMarker()).resolves.toBe(false);
  });

  it("is reported back, which is how the protection survives a restart", async () => {
    keychain.hasGenericPassword.mockResolvedValue(true);

    await expect(hasBiometricsMarker()).resolves.toBe(true);
    expect(keychain.hasGenericPassword).toHaveBeenCalledWith({
      service: "com.ledger.live.appLock.biometricCanary",
    });
  });

  it("reports none when nothing was ever armed", async () => {
    keychain.hasGenericPassword.mockResolvedValue(false);

    await expect(hasBiometricsMarker()).resolves.toBe(false);
  });

  it("is destroyed when biometrics is turned off", async () => {
    keychain.resetGenericPassword.mockResolvedValue(true);

    await clearBiometricsMarker();

    expect(keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: "com.ledger.live.appLock.biometricCanary",
    });
  });
});
