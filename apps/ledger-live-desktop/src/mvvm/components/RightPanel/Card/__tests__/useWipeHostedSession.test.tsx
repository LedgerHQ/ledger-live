import { ipcRenderer } from "electron";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { act } from "@testing-library/react";
import { renderHook } from "tests/testSetup";
import { payCardAuthSlice } from "@features/flow-pay-card-auth/state";
import type { ReduxStore } from "~/state-manager/configureStore";
import { useWipeHostedSession } from "../useWipeHostedSession";

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

const LOGIN_ID = "baanx-login-url";
const HOSTED_ID = "baanx-hosted-url";

const LOGIN_MANIFEST = {
  id: LOGIN_ID,
  url: "https://dev.api.baanx.test/v1/auth/oauth2/authorize",
};
const HOSTED_MANIFEST = { id: HOSTED_ID, url: "https://ledger.baanxapi.test" };

const CATALOG: Record<string, unknown> = {
  [LOGIN_ID]: LOGIN_MANIFEST,
  [HOSTED_ID]: HOSTED_MANIFEST,
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
  expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [LOGIN_MANIFEST.url]);
  expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [HOSTED_MANIFEST.url]);
}

describe("useWipeHostedSession", () => {
  beforeEach(() => {
    mockedInvoke.mockClear();
    manifestsFrom(CATALOG);
  });

  it("ends the provider session on each manifest the env names, on the entry of the pay tab", () => {
    renderHook(() => useWipeHostedSession());

    expectBothManifestsWiped();
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it("ends it again on the sign in", () => {
    const { store } = renderHook(() => useWipeHostedSession());
    mockedInvoke.mockClear();

    signIn(store, true);

    expectBothManifestsWiped();
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it("ends it again on the logout", () => {
    const { store } = renderHook(() => useWipeHostedSession());
    mockedInvoke.mockClear();

    signIn(store, true);
    signIn(store, false);

    expect(mockedInvoke).toHaveBeenCalledTimes(4);
  });

  it("ends it once more on every later entry of the pay tab", () => {
    const first = renderHook(() => useWipeHostedSession());

    first.unmount();
    mockedInvoke.mockClear();
    renderHook(() => useWipeHostedSession());

    expectBothManifestsWiped();
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it("asks for nothing while the catalog holds no manifest", () => {
    manifestsFrom({});

    const { store } = renderHook(() => useWipeHostedSession());

    signIn(store, true);

    expect(mockedInvoke).not.toHaveBeenCalled();
  });

  it("still wipes once the manifests resolve, for an entry seen while they had not", () => {
    manifestsFrom({});
    const { rerender } = renderHook(() => useWipeHostedSession());

    expect(mockedInvoke).not.toHaveBeenCalled();

    manifestsFrom(CATALOG);
    rerender();

    expectBothManifestsWiped();
  });

  it("wipes the manifest that resolved first, and the other one as soon as it follows", () => {
    manifestsFrom({});
    const { rerender } = renderHook(() => useWipeHostedSession());

    manifestsFrom({ [LOGIN_ID]: LOGIN_MANIFEST });
    rerender();

    expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [LOGIN_MANIFEST.url]);
    expect(mockedInvoke).toHaveBeenCalledTimes(1);

    manifestsFrom(CATALOG);
    rerender();

    expectBothManifestsWiped();
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it("still wipes once the manifests resolve, after a toggle that netted no change", () => {
    // Signing in then out again while the manifests are still resolving nets out to the same
    // isSignedIn value the hook started with. A wipe still has to fire: the brief signed-in window
    // may have set cookies or minted tokens at the provider.
    manifestsFrom({});
    const { store, rerender } = renderHook(() => useWipeHostedSession());

    signIn(store, true);
    signIn(store, false);
    expect(mockedInvoke).not.toHaveBeenCalled();

    manifestsFrom(CATALOG);
    rerender();

    expectBothManifestsWiped();
  });
});
