import { setHasPassword } from "@features/platform-app-lock";
import { act, fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import React from "react";
import { NavigatorName } from "~/const";
import AuthSecurityToggle from "~/screens/Settings/General/AuthSecurityToggle";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useNavigation: () => ({ navigate: mockNavigate }) };
});

const revamped = (hasPassword: boolean) =>
  withFlagOverrides({ lwmPasswordRevamp: { enabled: true } }, state => ({
    ...state,
    appLock: { ...state.appLock, hasPassword },
  }));

beforeEach(() => jest.clearAllMocks());

describe("the password row in Settings", () => {
  it("is on when a password is stored", async () => {
    render(<AuthSecurityToggle />, { overrideInitialState: revamped(true) });

    expect(await screen.findByTestId("password-settings-switch")).toBeChecked();
  });

  it("is off when none is stored", async () => {
    render(<AuthSecurityToggle />, { overrideInitialState: revamped(false) });

    expect(await screen.findByTestId("password-settings-switch")).not.toBeChecked();
  });

  // A switch changes value rather than being pressed, and userEvent has no toggle for it.
  const toggle = async (next: boolean) =>
    fireEvent(await screen.findByTestId("password-settings-switch"), "valueChange", next);

  it("follows the stored state rather than the tap", async () => {
    render(<AuthSecurityToggle />, { overrideInitialState: revamped(false) });

    await toggle(true);

    // The flow decides; a cancelled add must not leave the switch on.
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.PasswordAddFlow);
    expect(screen.getByTestId("password-settings-switch")).not.toBeChecked();
  });

  it("sends a removal to the modify flow", async () => {
    render(<AuthSecurityToggle />, { overrideInitialState: revamped(true) });

    await toggle(false);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.PasswordModifyFlow);
  });

  it("reflects a password stored while the screen is open", async () => {
    const { store } = render(<AuthSecurityToggle />, { overrideInitialState: revamped(false) });

    expect(await screen.findByTestId("password-settings-switch")).not.toBeChecked();

    act(() => {
      store.dispatch(setHasPassword(true));
    });

    expect(await screen.findByTestId("password-settings-switch")).toBeChecked();
  });

  it("leaves the legacy row on the legacy state when the flag is off", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: state => ({
        ...state,
        appLock: { ...state.appLock, hasPassword: true },
      }),
    });

    expect(await screen.findByTestId("password-settings-switch")).not.toBeChecked();
  });
});
