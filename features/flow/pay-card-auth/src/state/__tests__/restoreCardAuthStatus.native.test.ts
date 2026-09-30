import { getCardSessionToken } from "@features/platform-card";
import { configureStore } from "@reduxjs/toolkit";
import { restoreCardAuthStatus } from "../restoreCardAuthStatus";
import { selectCardAuthStatus } from "../selectors";
import { payCardAuthSlice, setSignedIn } from "../slice";

jest.mock("@features/platform-card", () => ({
  getCardSessionToken: jest.fn(async () => "at_token"),
}));

function buildStore() {
  return configureStore({ reducer: { payCardAuth: payCardAuthSlice.reducer } });
}

describe("restoreCardAuthStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getCardSessionToken).mockResolvedValue("at_token");
  });

  it("signs in when a session is stored and the status is unknown", async () => {
    const store = buildStore();

    await restoreCardAuthStatus(store.dispatch, store.getState);

    expect(selectCardAuthStatus(store.getState())).toBe("signedIn");
  });

  it("keeps a status that was already resolved", async () => {
    const store = buildStore();
    store.dispatch(setSignedIn(false));

    await restoreCardAuthStatus(store.dispatch, store.getState);

    expect(selectCardAuthStatus(store.getState())).toBe("signedOut");
  });

  it("keeps a status resolved while the session read is pending", async () => {
    let resolveSessionRead: (token: string) => void = () => undefined;
    jest.mocked(getCardSessionToken).mockReturnValue(
      new Promise(resolve => {
        resolveSessionRead = resolve;
      }),
    );
    const store = buildStore();

    const restoring = restoreCardAuthStatus(store.dispatch, store.getState);
    store.dispatch(setSignedIn(false));
    resolveSessionRead("at_token");
    await restoring;

    expect(selectCardAuthStatus(store.getState())).toBe("signedOut");
  });

  it("keeps the status unknown when no session is stored", async () => {
    jest.mocked(getCardSessionToken).mockResolvedValue(null);
    const store = buildStore();

    await restoreCardAuthStatus(store.dispatch, store.getState);

    expect(selectCardAuthStatus(store.getState())).toBe("unknown");
  });

  it("resolves and keeps the status unknown when the session read fails", async () => {
    jest.mocked(getCardSessionToken).mockRejectedValue(new Error("keychain unavailable"));
    const store = buildStore();

    await expect(restoreCardAuthStatus(store.dispatch, store.getState)).resolves.toBeUndefined();

    expect(selectCardAuthStatus(store.getState())).toBe("unknown");
  });
});
