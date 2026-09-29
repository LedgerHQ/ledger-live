import { act, fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import React from "react";
import type { State } from "~/reducers/types";
import AuthSecurityToggle from "~/screens/Settings/General/AuthSecurityToggle";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  getBiometricsAvailability: jest.fn(),
  promptBiometrics: jest.fn(async () => ({ status: "succeeded" })),
  clearBiometricsMarker: jest.fn(async () => true),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  getCardSessionToken: jest.fn(),
}));

const navigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useNavigation: () => ({ navigate }) };
});

const { getBiometricsAvailability, promptBiometrics } = jest.requireMock(
  "@features/platform-app-lock",
);
const { getCardSessionToken } = jest.requireMock("@features/platform-card");

const BIOMETRICS_SWITCH = "biometrics-settings-switch";
const PASSWORD_SWITCH = "password-settings-switch";
const REFUSAL = "app-lock-keep-protection-dismiss";

const holding = (
  protection: Partial<State["appLock"]>,
  { hasCard = true }: { hasCard?: boolean } = {},
) => {
  getCardSessionToken.mockResolvedValue(hasCard ? "an-access-token" : null);

  return withFlagOverrides({ lwmPasswordRevamp: { enabled: true } }, (state: State) => ({
    ...state,
    appLock: { ...state.appLock, isHydrated: true, ...protection },
  }));
};

function deferred<T>(): Readonly<{ promise: Promise<T>; resolve: (value: T) => void }> {
  let settle: ((value: T) => void) | undefined;
  const promise = new Promise<T>(resolve => {
    settle = resolve;
  });

  return { promise, resolve: value => settle?.(value) };
}

beforeEach(() => {
  jest.clearAllMocks();
  getBiometricsAvailability.mockResolvedValue({ status: "available", kind: "FaceID" });
  getCardSessionToken.mockResolvedValue(null);
});

// A switch changes value rather than being pressed, and userEvent has no toggle for it. The handler
// awaits the Card session, so the event is fired inside an async act for its answer to land.
const turnOff = async (testID: string) => {
  const toggle = await screen.findByTestId(testID);

  await act(async () => {
    fireEvent(toggle, "valueChange", false);
  });
};

describe("keeping a protection while a card is active", () => {
  it("refuses the password where it is all that protects a card holder", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding({ hasPassword: true, biometricsEnabled: false }),
    });

    await turnOff(PASSWORD_SWITCH);

    expect(await screen.findByText("You can't turn off your password")).toBeVisible();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("refuses biometrics where they are all that protects a card holder, by name", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding({ hasPassword: false, biometricsEnabled: true }),
    });

    await turnOff(BIOMETRICS_SWITCH);

    expect(await screen.findByText("You can't turn off FaceID")).toBeVisible();
    expect(promptBiometrics).not.toHaveBeenCalled();
  });

  // The rule is "keep one", not "freeze them": the other protection still answers for the card.
  it("lets a card holder with both drop the password", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding({ hasPassword: true, biometricsEnabled: true }),
    });

    await turnOff(PASSWORD_SWITCH);

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(screen.queryByTestId(REFUSAL)).toBeNull();
  });

  it("lets a card holder with both turn biometrics off", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding({ hasPassword: true, biometricsEnabled: true }),
    });

    await turnOff(BIOMETRICS_SWITCH);

    await waitFor(() => expect(promptBiometrics).toHaveBeenCalled());
    expect(screen.queryByTestId(REFUSAL)).toBeNull();
  });

  it("leaves a user with no card free to remove their last protection", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding(
        { hasPassword: true, biometricsEnabled: false },
        { hasCard: false },
      ),
    });

    await turnOff(PASSWORD_SWITCH);

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(screen.queryByTestId(REFUSAL)).toBeNull();
  });

  it("lets the holder carry on once the refusal is acknowledged", async () => {
    const { user } = render(<AuthSecurityToggle />, {
      overrideInitialState: holding({ hasPassword: false, biometricsEnabled: true }),
    });

    await turnOff(BIOMETRICS_SWITCH);
    await user.press(await screen.findByTestId(REFUSAL));

    await waitFor(() => expect(screen.queryByText("You can't turn off FaceID")).toBeNull());
    expect(screen.getByTestId(BIOMETRICS_SWITCH)).toBeVisible();
  });

  // The stored session, not the signed-in state: a holder who has not opened the Pay tab on this
  // launch, or who has the feature flag off, is still a holder.
  it("asks the stored session rather than anything the Pay tab set up", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding({ hasPassword: true, biometricsEnabled: false }),
    });

    await turnOff(PASSWORD_SWITCH);

    expect(await screen.findByText("You can't turn off your password")).toBeVisible();
    expect(getCardSessionToken).toHaveBeenCalled();
  });

  // The answer is awaited, so a tap that lands before the keychain has answered cannot slip through
  // on a default.
  it("lets nothing through while the session is still being read", async () => {
    const session = deferred<string | null>();
    const state = holding({ hasPassword: true, biometricsEnabled: false });
    getCardSessionToken.mockReturnValue(session.promise);

    render(<AuthSecurityToggle />, { overrideInitialState: state });

    await turnOff(PASSWORD_SWITCH);

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.queryByTestId(REFUSAL)).toBeNull();

    await act(async () => {
      session.resolve("an-access-token");
    });

    expect(await screen.findByText("You can't turn off your password")).toBeVisible();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("starts one biometrics removal for two taps while the session is being read", async () => {
    const session = deferred<string | null>();
    const state = holding({ hasPassword: false, biometricsEnabled: true }, { hasCard: false });
    getCardSessionToken.mockReturnValue(session.promise);

    render(<AuthSecurityToggle />, { overrideInitialState: state });

    const toggle = await screen.findByTestId(BIOMETRICS_SWITCH);

    await act(async () => {
      fireEvent(toggle, "valueChange", false);
      fireEvent(toggle, "valueChange", false);
    });

    await act(async () => {
      session.resolve(null);
    });

    await waitFor(() => expect(promptBiometrics).toHaveBeenCalledTimes(1));
  });

  it("starts one password removal for two taps while the session is being read", async () => {
    const session = deferred<string | null>();
    const state = holding({ hasPassword: true, biometricsEnabled: false }, { hasCard: false });
    getCardSessionToken.mockReturnValue(session.promise);

    render(<AuthSecurityToggle />, { overrideInitialState: state });

    const toggle = await screen.findByTestId(PASSWORD_SWITCH);

    await act(async () => {
      fireEvent(toggle, "valueChange", false);
      fireEvent(toggle, "valueChange", false);
    });

    await act(async () => {
      session.resolve(null);
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
  });

  // A Card login starting a new session invalidates any read already in flight, which then answers
  // null although a session now exists.
  it("asks again when the first read was invalidated by a new session", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding(
        { hasPassword: true, biometricsEnabled: false },
        { hasCard: false },
      ),
    });

    await screen.findByTestId(PASSWORD_SWITCH);
    getCardSessionToken.mockResolvedValueOnce(null).mockResolvedValueOnce("an-access-token");

    await turnOff(PASSWORD_SWITCH);

    expect(await screen.findByText("You can't turn off your password")).toBeVisible();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("follows a session that started after the screen opened", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding(
        { hasPassword: true, biometricsEnabled: false },
        { hasCard: false },
      ),
    });

    await screen.findByTestId(PASSWORD_SWITCH);
    getCardSessionToken.mockResolvedValue("an-access-token");

    await turnOff(PASSWORD_SWITCH);

    expect(await screen.findByText("You can't turn off your password")).toBeVisible();
  });

  it("does not read the session when the protection is not the last one", async () => {
    render(<AuthSecurityToggle />, {
      overrideInitialState: holding({ hasPassword: true, biometricsEnabled: true }),
    });

    await turnOff(PASSWORD_SWITCH);

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(getCardSessionToken).not.toHaveBeenCalled();
  });

  // A refusal can be retried; a removal cannot be undone.
  it("refuses when the session cannot be read at all", async () => {
    const state = holding({ hasPassword: true, biometricsEnabled: false });
    getCardSessionToken.mockRejectedValue(new Error("keychain unavailable"));

    render(<AuthSecurityToggle />, { overrideInitialState: state });

    await turnOff(PASSWORD_SWITCH);

    expect(await screen.findByText("You can't turn off your password")).toBeVisible();
    expect(navigate).not.toHaveBeenCalled();
  });
});
