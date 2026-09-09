import { ipcRenderer } from "electron";
import { act } from "@testing-library/react";
import { setEnv } from "@shared/env";
import { renderHook } from "tests/testSetup";
import { payCardAuthSlice } from "@features/flow-pay-card-auth/state";
import type { ReduxStore } from "~/state-manager/configureStore";
import { useWipeHostedSessionOnSignInChange } from "../useWipeHostedSession";

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockedInvoke = jest.mocked(ipcRenderer.invoke);

const API_URL = "https://card.api.test";
const HOSTED_UI_URL = "https://hosted.test";

function signIn(store: ReduxStore, isSignedIn: boolean) {
  act(() => {
    store.dispatch(payCardAuthSlice.actions.setSignedIn(isSignedIn));
  });
}

describe("useWipeHostedSessionOnSignInChange", () => {
  beforeEach(() => {
    mockedInvoke.mockClear();
    setEnv("CARD_BAANX_API_URL", API_URL);
    setEnv("CARD_BAANX_HOSTED_UI", HOSTED_UI_URL);
  });

  it("ends the provider session on both hosts once the card holder signs in", () => {
    const { store } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);

    expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [
      "card.api.test",
      "hosted.test",
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

  it("asks for nothing when the environment holds no usable URL", () => {
    setEnv("CARD_BAANX_API_URL", "");
    setEnv("CARD_BAANX_HOSTED_UI", "");

    const { store } = renderHook(() => useWipeHostedSessionOnSignInChange());

    signIn(store, true);

    expect(mockedInvoke).not.toHaveBeenCalled();
  });
});
