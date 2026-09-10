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

const CATALOG: Record<string, unknown> = {
  "baanx-login-url-stg": {
    id: "baanx-login-url-stg",
    url: "https://dev.api.baanx.test/v1/auth/oauth2/authorize",
  },
  "baanx-hosted-url-stg": { id: "baanx-hosted-url-stg", url: "https://ledger.baanxapi.test" },
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

describe("useWipeHostedSessionOnSignInChange", () => {
  beforeEach(() => {
    mockedInvoke.mockClear();
    manifestsFrom(CATALOG);
  });

  it("ends the provider session on the origins the manifests name", () => {
    const { store } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);

    expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [
      "https://dev.api.baanx.test",
      "https://ledger.baanxapi.test",
    ]);
  });

  it("ends it again on the logout", () => {
    const { store } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);
    signIn(store, false);

    expect(mockedInvoke).toHaveBeenCalledTimes(2);
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

    expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [
      "https://dev.api.baanx.test",
      "https://ledger.baanxapi.test",
    ]);
  });
});
