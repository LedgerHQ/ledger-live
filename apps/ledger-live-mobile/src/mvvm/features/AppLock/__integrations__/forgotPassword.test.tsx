import { act, render, screen } from "@tests/test-renderer";
import React from "react";
import { Keyboard } from "react-native";
import { UnlockScreen } from "../screens/Unlock";

jest.mock("../adapters/biometrics", () => ({
  promptBiometrics: jest.fn(async () => ({ status: "failed" })),
}));

jest.mock("../adapters/passwordVerification", () => ({
  checkPassword: jest.fn(async () => ({ status: "incorrect" })),
}));

jest.mock("../components/ForgotPasswordSheet", () => ({
  ForgotPasswordSheet: ({ isOpen }: Readonly<{ isOpen: boolean }>) => {
    openRequests.push(isOpen);
    return null;
  },
}));

const openRequests: boolean[] = [];
const hideListeners: (() => void)[] = [];

const isSheetAskedToOpen = () => openRequests[openRequests.length - 1];

beforeEach(() => {
  openRequests.length = 0;
  hideListeners.length = 0;
  jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
  jest.spyOn(Keyboard, "dismiss").mockImplementation(() => undefined);
  jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, listener: () => void) => {
    if (event === "keyboardDidHide") {
      hideListeners.push(listener);
    }

    return { remove: jest.fn() };
  }) as unknown as typeof Keyboard.addListener);
});

afterEach(() => jest.restoreAllMocks());

const renderUnlock = () =>
  render(<UnlockScreen />, {
    overrideInitialState: state => ({
      ...state,
      appLock: {
        hasPassword: true,
        biometricsEnabled: false,
        isLocked: true,
        needsLongerPassword: false,
      },
    }),
  });

describe("the forgot-password sheet", () => {
  it("waits for the keyboard to be down before opening, so the sheet can be closed", async () => {
    const { user } = renderUnlock();

    await user.press(await screen.findByTestId("app-lock-unlock-forgot-password"));

    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    expect(isSheetAskedToOpen()).toBe(false);

    await act(async () => {
      hideListeners.forEach(hidden => hidden());
    });

    expect(isSheetAskedToOpen()).toBe(true);
  });

  it("opens straight away when there is no keyboard to wait for", async () => {
    jest.spyOn(Keyboard, "isVisible").mockReturnValue(false);

    const { user } = renderUnlock();

    await user.press(await screen.findByTestId("app-lock-unlock-forgot-password"));

    expect(Keyboard.dismiss).not.toHaveBeenCalled();
    expect(isSheetAskedToOpen()).toBe(true);
  });
});
