import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  accountAnalyticsIntroductionSlice,
  dismissAccountAnalyticsIntroduction,
  recordAccountAnalyticsIntroductionEligibility,
} from "@features/flow-account-detail-analytics-notice/state";
import { useAccountDetailToolProps } from "./useAccountDetailToolProps";

function setup() {
  const store = configureStore({
    reducer: { accountAnalyticsIntroduction: accountAnalyticsIntroductionSlice.reducer },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAccountDetailToolProps(), { wrapper });
  return { store, result };
}

describe("useAccountDetailToolProps", () => {
  it("reports a card that was never dismissed", () => {
    const { result } = setup();
    expect(result.current.analyticsIntroduction.hasDismissed).toBe(false);
  });

  it("reports an eligibility that is not recorded yet, then the recorded one", () => {
    const { store, result } = setup();
    expect(result.current.analyticsIntroduction.isEligible).toBeNull();

    act(() => {
      store.dispatch(recordAccountAnalyticsIntroductionEligibility(false));
    });

    expect(result.current.analyticsIntroduction.isEligible).toBe(false);
  });

  it("forces a recorded eligibility, then clears it", () => {
    const { store, result } = setup();
    act(() => {
      store.dispatch(recordAccountAnalyticsIntroductionEligibility(false));
    });

    act(() => result.current.analyticsIntroduction.onEligibilityChange(true));
    expect(store.getState().accountAnalyticsIntroduction.isEligible).toBe(true);

    act(() => result.current.analyticsIntroduction.onEligibilityChange(null));
    expect(result.current.analyticsIntroduction.isEligible).toBeNull();
  });

  it("resets a dismissed card so it shows again", () => {
    const { store, result } = setup();
    act(() => {
      store.dispatch(dismissAccountAnalyticsIntroduction());
    });
    expect(result.current.analyticsIntroduction.hasDismissed).toBe(true);

    act(() => result.current.analyticsIntroduction.onReset());

    expect(result.current.analyticsIntroduction.hasDismissed).toBe(false);
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
  });
});
