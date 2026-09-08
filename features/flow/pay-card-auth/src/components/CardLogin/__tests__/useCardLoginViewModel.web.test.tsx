import { mapSnapshotToViewModel, type CardLoginLabels } from "../useCardLoginViewModel";

const onLoginPress = jest.fn();

const labels: CardLoginLabels = {
  title: "Log in to access your Card",
  description: "You’ve been logged out for security",
  login: "Log in",
  errors: {
    pkce_failed: "Login could not start. Please try again.",
    browser_open_failed: "The login page could not open. Please try again.",
    missing_attempt: "This login is no longer valid. Please log in again.",
    exchange_failed: "Login could not be completed. Please try again.",
    persist_failed: "Your session could not be saved. Please try again.",
    fetch_user_failed: "Your card could not be loaded. Please try again.",
  },
};

describe("mapSnapshotToViewModel", () => {
  it.each(["idle", "error", "awaitingCallback"] as const)(
    "offers the login action in %s",
    value => {
      const login = mapSnapshotToViewModel(value, null, labels, onLoginPress);

      expect(login?.isLoading).toBe(false);
      expect(login?.loginLabel).toBe("Log in");
    },
  );

  it.each([
    "hydrating",
    "preparingAttempt",
    "awaitingHostedLogin",
    "validatingCallback",
    "exchangingCode",
    "persistingSession",
    "authenticated",
    "fetchingUser",
    "clearingAttempt",
  ] as const)("shows work in progress in %s", value => {
    expect(mapSnapshotToViewModel(value, null, labels, onLoginPress)?.isLoading).toBe(true);
  });

  it("offers nothing once the card holder is signed in", () => {
    // `CardMore` holds the screen from here, and it reads the same flag to know it.
    expect(mapSnapshotToViewModel("ready", null, labels, onLoginPress)).toBeNull();
  });

  it("shows the copy the host translated", () => {
    const login = mapSnapshotToViewModel("idle", null, labels, onLoginPress);

    expect(login?.title).toBe(labels.title);
    expect(login?.description).toBe(labels.description);
  });

  it("shows no message while there is no error", () => {
    expect(mapSnapshotToViewModel("idle", null, labels, onLoginPress)?.errorMessage).toBeNull();
  });

  it.each([
    "pkce_failed",
    "browser_open_failed",
    "missing_attempt",
    "exchange_failed",
    "persist_failed",
    "fetch_user_failed",
  ] as const)("shows a message for %s", errorKind => {
    const login = mapSnapshotToViewModel("error", errorKind, labels, onLoginPress);

    expect(login?.errorMessage).toBe(labels.errors[errorKind]);
    // The copy is ours, never the backend's or RTK's.
    expect(login?.errorMessage).not.toContain(errorKind);
  });
});
