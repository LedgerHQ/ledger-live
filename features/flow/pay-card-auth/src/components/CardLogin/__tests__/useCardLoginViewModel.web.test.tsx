import { mapSnapshotToViewProps } from "../useCardLoginViewModel";

describe("mapSnapshotToViewProps", () => {
  it.each(["idle", "error"] as const)("offers the login action in %s", value => {
    const props = mapSnapshotToViewProps(value, null);

    expect(props.isHidden).toBe(false);
    expect(props.isLoading).toBe(false);
    expect(props.loginLabel).toBe("Login");
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
    const props = mapSnapshotToViewProps(value, null);

    expect(props.isHidden).toBe(false);
    expect(props.isLoading).toBe(true);
  });

  it("renders nothing once the user is signed in", () => {
    expect(mapSnapshotToViewProps("ready", null).isHidden).toBe(true);
  });

  it("shows no message while there is no error", () => {
    expect(mapSnapshotToViewProps("idle", null).errorMessage).toBeNull();
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
    const { errorMessage } = mapSnapshotToViewProps("error", errorKind);

    expect(errorMessage).toMatch(/\.$/);
    // The copy is ours, never the backend's or RTK's.
    expect(errorMessage).not.toContain(errorKind);
  });
});
