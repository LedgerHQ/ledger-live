jest.mock("react-native-biometrics", () =>
  jest.fn().mockImplementation(() => ({ simplePrompt: mockSimplePrompt })),
);

jest.mock("react-native-keychain", () => ({
  ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: "biometryAnyOrDevicePasscode" },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly" },
  getSupportedBiometryType: jest.fn(),
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  hasGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const mockSimplePrompt = jest.fn();

import {
  armBiometricPrompt,
  disarmBiometricPrompt,
  getBiometricsAvailability,
  hasArmedBiometricPrompt,
  promptBiometrics,
} from "./biometrics";

const keychain = jest.requireMock("react-native-keychain");
const ReactNativeBiometrics = jest.requireMock("react-native-biometrics");

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
  it("succeeds when the OS confirms the owner", async () => {
    mockSimplePrompt.mockResolvedValue({ success: true });

    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "succeeded" });
  });

  it("offers the device PIN alongside biometrics, so a broken finger is not a lockout", async () => {
    mockSimplePrompt.mockResolvedValue({ success: true });

    await promptBiometrics("Unlock");

    expect(ReactNativeBiometrics).toHaveBeenCalledWith({ allowDeviceCredentials: true });
    expect(mockSimplePrompt).toHaveBeenCalledWith({ promptMessage: "Unlock" });
  });

  it("tells a refusal apart from a dismissal", async () => {
    mockSimplePrompt.mockResolvedValue({ success: false, error: "User cancelled" });
    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "cancelled" });

    mockSimplePrompt.mockResolvedValue({ success: false, error: "Authentication failed" });
    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "failed" });

    mockSimplePrompt.mockResolvedValue({ success: false, error: "Too many attempts" });
    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "lockedOut" });
  });

  it("reports a prompt that could not be shown as a failure", async () => {
    mockSimplePrompt.mockRejectedValue(new Error("no fragment activity"));

    await expect(promptBiometrics("Unlock")).resolves.toEqual({ status: "failed" });
  });
});

describe("the armed record", () => {
  it("records it as a plain item, so recording it does not raise a prompt of its own", async () => {
    keychain.setGenericPassword.mockResolvedValue({ service: "app-lock" });

    await expect(armBiometricPrompt()).resolves.toBe(true);

    const [, , options] = keychain.setGenericPassword.mock.calls[0];
    expect(options).not.toHaveProperty("accessControl");
    expect(options).toMatchObject({ accessible: "whenUnlockedThisDeviceOnly" });
  });

  it("reports arming that the keychain refused", async () => {
    keychain.setGenericPassword.mockResolvedValue(false);

    await expect(armBiometricPrompt()).resolves.toBe(false);
  });

  it("reads back whether it is armed, since protection state is not persisted", async () => {
    keychain.hasGenericPassword.mockResolvedValue(true);

    await expect(hasArmedBiometricPrompt()).resolves.toBe(true);
  });

  it("disarms by destroying the record", async () => {
    keychain.resetGenericPassword.mockResolvedValue(true);

    await disarmBiometricPrompt();

    expect(keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: "com.ledger.live.appLock.biometricCanary",
    });
  });
});
