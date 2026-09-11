import { ipcRenderer } from "electron";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { act } from "@testing-library/react";
import { renderHook } from "tests/testSetup";
import { payCardAuthSlice } from "@features/flow-pay-card-auth/state";
import type { ReduxStore } from "~/state-manager/configureStore";
import { useWipeHostedSessionOnSignInChange } from "../useWipeHostedSession";

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

const mockedInvoke = jest.mocked(ipcRenderer.invoke);
const mockedManifest = jest.mocked(useLiveAppManifest);

const LOGIN_URL = "https://dev.api.baanx.test/v1/auth/oauth2/authorize";
const HOSTED_URL = "https://ledger.baanxapi.test";

const LOGIN_MANIFEST = { id: "baanx-login-url-stg", url: LOGIN_URL };

const CATALOG: Record<string, unknown> = {
  "baanx-login-url-stg": LOGIN_MANIFEST,
  "baanx-hosted-url-stg": { id: "baanx-hosted-url-stg", url: HOSTED_URL },
};

function manifestsFrom(catalog: Record<string, unknown>) {
  mockedManifest.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id => (id ? catalog[id] : undefined) as ReturnType<typeof useLiveAppManifest>,
  );
}

function signIn(store: ReduxStore, isSignedIn: boolean) {
  act(() => {
    store.dispatch(payCardAuthSlice.actions.setSignedIn(isSignedIn));
  });
}

function expectBothManifestsWiped() {
  expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [LOGIN_URL]);
  expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [HOSTED_URL]);
}

describe("useWipeHostedSessionOnSignInChange", () => {
  beforeEach(() => {
    mockedInvoke.mockClear();
    manifestsFrom(CATALOG);
  });

  it("ends the provider session on each manifest the flag names", () => {
    const { store } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);

    expectBothManifestsWiped();
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it("ends it again on the logout", () => {
    const { store } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);
    signIn(store, false);

    expect(mockedInvoke).toHaveBeenCalledTimes(4);
  });

  it("leaves the session alone while the login runs", () => {
    renderHook(() => useWipeHostedSessionOnSignInChange());

    expect(mockedInvoke).not.toHaveBeenCalled();
  });

  it("asks for nothing while the catalog holds no manifest", () => {
    manifestsFrom({});

    const { store } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);

    expect(mockedInvoke).not.toHaveBeenCalled();
  });

  it("still wipes once the manifests resolve, for a sign-in seen while they had not", () => {
    manifestsFrom({});
    const { store, rerender } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);
    expect(mockedInvoke).not.toHaveBeenCalled();

    manifestsFrom(CATALOG);
    rerender();

    expectBothManifestsWiped();
  });

  it("waits for the second manifest, rather than spending the wipe on the first", () => {
    manifestsFrom({});
    const { store, rerender } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);

    manifestsFrom({ "baanx-login-url-stg": LOGIN_MANIFEST });
    rerender();
    expect(mockedInvoke).not.toHaveBeenCalled();

    manifestsFrom(CATALOG);
    rerender();

    expectBothManifestsWiped();
  });

  it("still wipes once the manifests resolve, after a toggle that netted no change", () => {
    // Signing in then out again while the manifests are still resolving nets out to the same
    // isSignedIn value the hook started with. A wipe still has to fire: the brief signed-in window
    // may have set cookies or minted tokens at the provider.
    manifestsFrom({});
    const { store, rerender } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);
    signIn(store, false);
    expect(mockedInvoke).not.toHaveBeenCalled();

    manifestsFrom(CATALOG);
    rerender();

    expectBothManifestsWiped();
  });
});
