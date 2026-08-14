import { mapSnapshotToViewModel } from "../useCardLoginViewModel";

const handlers = { onLoginPress: jest.fn(), onLogoutPress: jest.fn() };

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

describe("mapSnapshotToViewModel", () => {
  it.each(["idle", "error"] as const)("offers the login action in %s", value => {
    const { login, user: panel } = mapSnapshotToViewModel(value, null, undefined, handlers);

    expect(login?.isLoading).toBe(false);
    expect(login?.loginLabel).toBe("Login");
    expect(panel).toBeNull();
  });

  it.each([
    "hydrating",
    "preparingAttempt",
    "initiatingAuthorize",
    "awaitingHostedLogin",
    "validatingCallback",
    "exchangingCode",
    "persistingSession",
    "authenticated",
    "fetchingUser",
    "clearingAttempt",
  ] as const)("shows work in progress in %s", value => {
    const { login, user: panel } = mapSnapshotToViewModel(value, null, undefined, handlers);

    expect(login?.isLoading).toBe(true);
    expect(panel).toBeNull();
  });

  it("shows the card holder once signed in", () => {
    const { login, user: panel } = mapSnapshotToViewModel("ready", null, user, handlers);

    expect(login).toBeNull();
    expect(panel).toMatchObject({
      userId: user.id,
      verificationValue: "Verified",
      logoutLabel: "Log out",
      isLoading: false,
    });
  });

  it("keeps the logout action busy while the logout runs", () => {
    const { login, user: panel } = mapSnapshotToViewModel("loggingOut", null, user, handlers);

    expect(login).toBeNull();
    expect(panel?.isLoading).toBe(true);
  });

  it.each([
    ["UNVERIFIED", "Not verified"],
    ["PENDING", "In review"],
    ["VERIFIED", "Verified"],
    ["REJECTED", "Rejected"],
  ] as const)("reads %s as %s", (verificationState, expected) => {
    const { user: panel } = mapSnapshotToViewModel(
      "ready",
      null,
      { ...user, verificationState },
      handlers,
    );

    expect(panel?.verificationValue).toBe(expected);
  });

  it("shows neither half while the signed-in user is still on its way", () => {
    // `ready` with an empty cache: the panel would otherwise flash an account with no id.
    expect(mapSnapshotToViewModel("ready", null, undefined, handlers)).toEqual({
      login: null,
      user: null,
    });
  });

  it("shows no message while there is no error", () => {
    expect(
      mapSnapshotToViewModel("idle", null, undefined, handlers).login?.errorMessage,
    ).toBeNull();
  });

  it.each([
    "pkce_failed",
    "initiate_failed",
    "browser_open_failed",
    "missing_attempt",
    "state_mismatch",
    "exchange_failed",
    "persist_failed",
    "fetch_user_failed",
  ] as const)("shows a message for %s", errorKind => {
    const { login } = mapSnapshotToViewModel("error", errorKind, undefined, handlers);

    expect(login?.errorMessage).toMatch(/\.$/);
    // The copy is ours, never the backend's or RTK's.
    expect(login?.errorMessage).not.toContain(errorKind);
  });
});
