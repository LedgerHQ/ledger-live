import React from "react";
import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { payCardAuthSlice, setSessionResolving, setSignedIn } from "../../state/slice";
import { useCardAuthStatus } from "../useCardAuthStatus";

function renderCardAuthStatus(dispatchSignedIn?: boolean, isSessionResolving = false) {
  const store = configureStore({ reducer: { payCardAuth: payCardAuthSlice.reducer } });
  if (dispatchSignedIn !== undefined) {
    store.dispatch(setSignedIn(dispatchSignedIn));
  }
  store.dispatch(setSessionResolving(isSessionResolving));

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useCardAuthStatus(), { wrapper });
}

describe("useCardAuthStatus", () => {
  it("answers unknown while the session is still being resolved", () => {
    expect(renderCardAuthStatus().result.current).toBe("unknown");
  });

  it("answers signedOut once the machine reports nobody is signed in", () => {
    expect(renderCardAuthStatus(false).result.current).toBe("signedOut");
  });

  it("answers signedIn while a Card session is live", () => {
    expect(renderCardAuthStatus(true).result.current).toBe("signedIn");
  });

  it("answers unknown while the machine trades a redirect for a token after a sign out", () => {
    expect(renderCardAuthStatus(false, true).result.current).toBe("unknown");
  });

  it("keeps answering signedIn while the machine still resolves", () => {
    expect(renderCardAuthStatus(true, true).result.current).toBe("signedIn");
  });
});
