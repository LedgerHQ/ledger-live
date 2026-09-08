import { mapSnapshotToViewModel } from "../useCardLoginViewModel";

const onLoginPress = jest.fn();

describe("mapSnapshotToViewModel", () => {
  it.each(["idle", "error"] as const)("offers the login action in %s", value => {
    const login = mapSnapshotToViewModel(value, null, onLoginPress);

    expect(login?.isLoading).toBe(false);
    expect(login?.loginLabel).toBe("Login");
  });

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
    expect(mapSnapshotToViewModel(value, null, onLoginPress)?.isLoading).toBe(true);
  });

  it("offers nothing once the card holder is signed in", () => {
    // `CardMore` holds the screen from here, and it reads the same flag to know it.
    expect(mapSnapshotToViewModel("ready", null, onLoginPress)).toBeNull();
  });

  it("shows no message while there is no error", () => {
    expect(mapSnapshotToViewModel("idle", null, onLoginPress)?.errorMessage).toBeNull();
  });

  it.each([
    "pkce_failed",
    "browser_open_failed",
    "missing_attempt",
    "exchange_failed",
    "persist_failed",
    "fetch_user_failed",
  ] as const)("shows a message for %s", errorKind => {
    const login = mapSnapshotToViewModel("error", errorKind, onLoginPress);

    expect(login?.errorMessage).toMatch(/\.$/);
    // The copy is ours, never the backend's or RTK's.
    expect(login?.errorMessage).not.toContain(errorKind);
  });
});
