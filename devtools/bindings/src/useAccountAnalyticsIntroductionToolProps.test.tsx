import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  accountAnalyticsIntroductionSlice,
  dismissAccountAnalyticsIntroduction,
} from "@features/flow-account-detail-analytics-notice/state";
import { useAccountAnalyticsIntroductionToolProps } from "./useAccountAnalyticsIntroductionToolProps";

function setup() {
  const store = configureStore({
    reducer: { accountAnalyticsIntroduction: accountAnalyticsIntroductionSlice.reducer },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAccountAnalyticsIntroductionToolProps(), { wrapper });
  return { store, result };
}

describe("useAccountAnalyticsIntroductionToolProps", () => {
  it("reports a card that was never dismissed", () => {
    const { result } = setup();
    expect(result.current.hasDismissed).toBe(false);
  });

  it("resets a dismissed card so it shows again", () => {
    const { store, result } = setup();
    act(() => {
      store.dispatch(dismissAccountAnalyticsIntroduction());
    });
    expect(result.current.hasDismissed).toBe(true);

    act(() => result.current.onReset());

    expect(result.current.hasDismissed).toBe(false);
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
  });
});
