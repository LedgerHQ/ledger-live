import React from "react";
import { LONG_TIMEOUT, render, screen } from "@tests/test-renderer";
import { LongerPasswordScreen } from "../screens/LongerPassword";

jest.mock("react-native-keychain", () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly" },
  ACCESS_CONTROL: { APPLICATION_PASSWORD: "applicationPassword" },
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  hasGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(3)),
}));

jest.mock("../adapters/passwordDigest", () => ({
  APP_LOCK_SALT_LENGTH: 16,
  APP_LOCK_SCRYPT_PARAMS: { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 32 },
  derivePasswordDigest: jest.fn(async () => new Uint8Array(32).fill(9)),
  serialiseDerivation: <T,>(run: () => Promise<T>) => run(),
}));

const NEW_PASSWORD = "longenough";

const { setGenericPassword } = jest.requireMock("react-native-keychain");

describe("longer password requirement", () => {
  jest.setTimeout(LONG_TIMEOUT * 3);

  beforeEach(() => {
    jest.useRealTimers();
    setGenericPassword.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  const renderFlow = () =>
    render(<LongerPasswordScreen onDone={jest.fn()} />, {
      overrideInitialState: state => ({
        ...state,
        appLock: {
          hasPassword: true,
          biometricsEnabled: false,
          isLocked: false,
          needsLongerPassword: true,
        },
      }),
    });

  it("walks from the opening sheet to a new password and back to the app", async () => {
    const { user } = renderFlow();

    await user.press(await screen.findByText("Change password"));

    const chooseField = await screen.findByTestId("app-lock-setup-password-field");
    await user.type(chooseField, NEW_PASSWORD);
    await user.press(screen.getByTestId("app-lock-setup-password-continue"));

    const confirmField = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(confirmField, NEW_PASSWORD);
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(setGenericPassword).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("app-lock-longer-password-screen")).toBeNull();
    await user.press(await screen.findByText("Got it"));
  });

  it("keeps asking while the confirmation does not match", async () => {
    const { user } = renderFlow();

    await user.press(await screen.findByText("Change password"));

    const chooseField = await screen.findByTestId("app-lock-setup-password-field");
    await user.type(chooseField, NEW_PASSWORD);
    await user.press(screen.getByTestId("app-lock-setup-password-continue"));

    const confirmField = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(confirmField, "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(screen.getByTestId("app-lock-confirm-password-field")).toBeVisible();
    expect(screen.getByText("Passwords don't match")).toBeVisible();
    expect(setGenericPassword).not.toHaveBeenCalled();
  });
});
