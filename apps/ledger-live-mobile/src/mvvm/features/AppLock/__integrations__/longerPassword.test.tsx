import { lockApp, unlockApp } from "@features/platform-app-lock";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import React from "react";
import { BackHandler, Keyboard, StyleSheet, Text } from "react-native";
import type { State } from "~/reducers/types";
import { AppLockGate } from "../AppLockGate";
import { LongerPasswordGate } from "../LongerPasswordGate";
import { useLongerPasswordGateViewModel } from "../LongerPasswordGate/useLongerPasswordGateViewModel";

// The gate takes its state from the host, which is what lets `AppLockGate` hide the app behind it.
function Gate(): React.JSX.Element {
  return <LongerPasswordGate {...useLongerPasswordGateViewModel()} />;
}

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(3)),
}));

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  storeNewPassword: jest.fn(async () => undefined),
}));

const { storeNewPassword } = jest.requireMock("@features/platform-app-lock");

const PROMPT_CTA = "app-lock-change-password-confirm";
const ENTER_FIELD = "app-lock-setup-password-field";
const ENTER_CTA = "app-lock-setup-password-continue";
const CONFIRM_FIELD = "app-lock-confirm-password-field";
const CONFIRM_CTA = "app-lock-confirm-password-confirm";
const DONE_CTA = "app-lock-password-changed-done";

const NEW_PASSWORD = "longenough";

const owed = (overrides: Partial<State["appLock"]> = {}) =>
  withFlagOverrides({ lwmPasswordRevamp: { enabled: true } }, (state: State) => ({
    ...state,
    appLock: {
      ...state.appLock,
      isHydrated: true,
      hasPassword: true,
      needsLongerPassword: true,
      isLocked: false,
      ...overrides,
    },
  }));

beforeEach(() => jest.clearAllMocks());

describe("being required to choose a longer password", () => {
  it("opens on the prompt, whose only action is to change it", async () => {
    render(<Gate />, { overrideInitialState: owed() });

    expect(await screen.findByText("Change your password")).toBeVisible();
    expect(
      screen.getByText("For better security, enter a password of at least 6 characters."),
    ).toBeVisible();
    expect(screen.getByTestId(PROMPT_CTA)).toBeVisible();
  });

  it("walks the prompt, the new password and its confirmation, and stores it", async () => {
    const { store, user } = render(<Gate />, { overrideInitialState: owed() });

    await user.press(await screen.findByTestId(PROMPT_CTA));

    await user.type(await screen.findByTestId(ENTER_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(ENTER_CTA));

    expect(await screen.findByText("Confirm new password")).toBeVisible();

    await user.type(await screen.findByTestId(CONFIRM_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(CONFIRM_CTA));

    await waitFor(() => expect(storeNewPassword).toHaveBeenCalledTimes(1));
    expect(storeNewPassword).toHaveBeenCalledWith(NEW_PASSWORD, expect.any(Uint8Array));
    await waitFor(() => expect(store.getState().appLock.needsLongerPassword).toBe(false));
  });

  it("says the password changed, and leaves once that is acknowledged", async () => {
    const { user } = render(<Gate />, { overrideInitialState: owed() });

    await user.press(await screen.findByTestId(PROMPT_CTA));
    await user.type(await screen.findByTestId(ENTER_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(ENTER_CTA));
    await user.type(await screen.findByTestId(CONFIRM_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(CONFIRM_CTA));

    expect(await screen.findByText("Password changed")).toBeVisible();

    await user.press(screen.getByTestId(DONE_CTA));

    await waitFor(() => expect(screen.queryByText("Password changed")).toBeNull());
  });

  it("writes nothing when the two entries differ", async () => {
    const { user } = render(<Gate />, { overrideInitialState: owed() });

    await user.press(await screen.findByTestId(PROMPT_CTA));
    await user.type(await screen.findByTestId(ENTER_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(ENTER_CTA));
    await user.type(await screen.findByTestId(CONFIRM_FIELD), "somethingelse");
    await user.press(screen.getByTestId(CONFIRM_CTA));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
    await waitFor(() => expect(storeNewPassword).not.toHaveBeenCalled());
  });

  it("holds the flow where it is when the password cannot be stored", async () => {
    storeNewPassword.mockRejectedValueOnce(new Error("keychain unavailable"));
    const { store, user } = render(<Gate />, { overrideInitialState: owed() });

    await user.press(await screen.findByTestId(PROMPT_CTA));
    await user.type(await screen.findByTestId(ENTER_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(ENTER_CTA));
    await user.type(await screen.findByTestId(CONFIRM_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(CONFIRM_CTA));

    expect(
      await screen.findByText("We couldn't save your password. Please try again."),
    ).toBeVisible();
    expect(store.getState().appLock.needsLongerPassword).toBe(true);
  });

  // It arrives as the unlock screen leaves, whose keyboard would otherwise animate away over the
  // sheet.
  it("takes the keyboard away with it", async () => {
    const dismiss = jest.spyOn(Keyboard, "dismiss");

    render(<Gate />, { overrideInitialState: owed() });

    await screen.findByTestId(PROMPT_CTA);

    expect(dismiss).toHaveBeenCalled();
  });

  it("raises it again for the step that asks for a password", async () => {
    const { user } = render(<Gate />, { overrideInitialState: owed() });

    await user.press(await screen.findByTestId(PROMPT_CTA));

    expect(await screen.findByTestId(ENTER_FIELD)).toHaveProp("autoFocus", true);
  });

  // A typography preset carries no colour, so a title asking for one and nothing else is painted
  // in React Native's default black — invisible on the dark canvas.
  it.each([
    ["the step that asks for a password", "Enter new password", false],
    ["the step that confirms it", "Confirm new password", true],
  ])("paints the title of %s", async (_case, title, isConfirm) => {
    const { user } = render(<Gate />, { overrideInitialState: owed() });

    await user.press(await screen.findByTestId(PROMPT_CTA));

    if (isConfirm) {
      await user.type(await screen.findByTestId(ENTER_FIELD), NEW_PASSWORD);
      await user.press(screen.getByTestId(ENTER_CTA));
    }

    const heading = await screen.findByText(title);

    expect(StyleSheet.flatten(heading.props.style).color).toBeDefined();
  });

  it("keeps the chosen password across a lock that interrupts the confirmation", async () => {
    const { store, user } = render(<Gate />, { overrideInitialState: owed() });

    await user.press(await screen.findByTestId(PROMPT_CTA));
    await user.type(await screen.findByTestId(ENTER_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(ENTER_CTA));
    await screen.findByTestId(CONFIRM_FIELD);

    act(() => {
      store.dispatch(lockApp());
    });

    await waitFor(() => expect(screen.queryByTestId(CONFIRM_FIELD)).toBeNull());

    act(() => {
      store.dispatch(unlockApp());
    });

    await user.type(await screen.findByTestId(CONFIRM_FIELD), NEW_PASSWORD);
    await user.press(screen.getByTestId(CONFIRM_CTA));

    await waitFor(() =>
      expect(storeNewPassword).toHaveBeenCalledWith(NEW_PASSWORD, expect.any(Uint8Array)),
    );
  });

  // The sheet registers a back handler of its own, so what matters is that one of them refuses.
  it("swallows the hardware back press, the one way left out of it", async () => {
    const addEventListener = jest.spyOn(BackHandler, "addEventListener");

    render(<Gate />, { overrideInitialState: owed() });

    await screen.findByTestId(PROMPT_CTA);

    expect(swallowsBackPress(addEventListener)).toBe(true);
  });
});

function swallowsBackPress(addEventListener: jest.SpyInstance): boolean {
  return addEventListener.mock.calls
    .filter(([event]) => event === "hardwareBackPress")
    .some(([, handler]) => handler() === true);
}

// `accessibilityViewIsModal` hides nothing from TalkBack, so the app behind the prompt has to be
// hidden explicitly.
describe("the app behind it", () => {
  const APP_CONTENT = "portfolio";
  const UNLOCK_SCREEN = "app-lock-unlock-screen";

  // A configured app locks itself on boot, so the lock is released before anything is attributed
  // to this flow.
  const renderUnlocked = async (state = owed()) => {
    const rendered = render(
      <AppLockGate>
        <Text>{APP_CONTENT}</Text>
      </AppLockGate>,
      { overrideInitialState: state },
    );

    await screen.findByTestId(UNLOCK_SCREEN);

    act(() => {
      rendered.store.dispatch(unlockApp());
    });

    await waitFor(() => expect(screen.queryByTestId(UNLOCK_SCREEN)).toBeNull());

    return rendered;
  };

  it("is out of reach while the change is owed", async () => {
    await renderUnlocked();

    expect(screen.queryByText(APP_CONTENT)).toBeNull();
    expect(screen.getByText(APP_CONTENT, { includeHiddenElements: true })).toBeTruthy();
  });

  it("is reachable again for a user who owes nothing", async () => {
    await renderUnlocked(owed({ needsLongerPassword: false }));

    expect(screen.getByText(APP_CONTENT)).toBeVisible();
  });
});

describe("not being required to", () => {
  it("stays away from a user whose password is long enough", async () => {
    render(<Gate />, {
      overrideInitialState: owed({ needsLongerPassword: false }),
    });

    await waitFor(() => expect(screen.queryByTestId(PROMPT_CTA)).toBeNull());
  });

  it("leaves the back press alone", async () => {
    const addEventListener = jest.spyOn(BackHandler, "addEventListener");

    render(<Gate />, {
      overrideInitialState: owed({ needsLongerPassword: false }),
    });

    await waitFor(() => expect(screen.queryByTestId(PROMPT_CTA)).toBeNull());

    expect(swallowsBackPress(addEventListener)).toBe(false);
  });

  it("waits behind the unlock screen rather than asking over it", async () => {
    render(<Gate />, { overrideInitialState: owed({ isLocked: true }) });

    await waitFor(() => expect(screen.queryByTestId(PROMPT_CTA)).toBeNull());
  });

  it("stays away while the flag is off, where the legacy screens still rule", async () => {
    render(<Gate />, {
      overrideInitialState: (state: State) => ({
        ...state,
        appLock: {
          ...state.appLock,
          isHydrated: true,
          hasPassword: false,
          needsLongerPassword: true,
        },
      }),
    });

    await waitFor(() => expect(screen.queryByTestId(PROMPT_CTA)).toBeNull());
  });
});
