import React from "react";
import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { payCardAuthSlice, setSignedIn } from "../../state/slice";
import { useIsCardSignedIn } from "../useIsCardSignedIn";

function renderIsCardSignedIn(isSignedIn: boolean) {
  const store = configureStore({ reducer: { payCardAuth: payCardAuthSlice.reducer } });
  store.dispatch(setSignedIn(isSignedIn));

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useIsCardSignedIn(), { wrapper });
}

describe("useIsCardSignedIn", () => {
  it("answers false while nobody is signed in", () => {
    expect(renderIsCardSignedIn(false).result.current).toBe(false);
  });

  it("answers true while a Card session is live", () => {
    expect(renderIsCardSignedIn(true).result.current).toBe(true);
  });
});
