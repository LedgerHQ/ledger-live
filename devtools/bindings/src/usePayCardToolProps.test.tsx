import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import {
  payCardFeatureTourSlice,
  markPayCardFeatureTourSeen,
} from "@features/flow-pay-feature-tour/state";
import {
  payRequestVerifyHintSlice,
  markReceiveVerifyHintSeen,
} from "@features/flow-pay-request/state";
import { cardApi } from "@shared/api-services";
import {
  payCardLoginIntroSlice,
  markPayCardLoginIntroSeen,
} from "@features/flow-pay-card-auth/state";
import { payCardOnboardingWidgetSlice } from "@features/flow-pay-card-widget/state";
import { usePayCardToolProps } from "./usePayCardToolProps";

function buildStore() {
  return configureStore({
    reducer: {
      featureFlags: featureFlagsReducer,
      payCardFeatureTour: payCardFeatureTourSlice.reducer,
      payRequestVerifyHint: payRequestVerifyHintSlice.reducer,
      payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer,
      // The tool reads the Card endpoints, so its api has to be part of the store under test.
      [cardApi.reducerPath]: cardApi.reducer,
      payCardLoginIntro: payCardLoginIntroSlice.reducer,
    },
    middleware: gdm =>
      gdm()
        .concat(createFeatureFlagsMiddleware({ resolutionConfig: {} }))
        .concat(cardApi.middleware),
  });
}

function withStore(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
}

describe("usePayCardToolProps", () => {
  let store: ReturnType<typeof buildStore>;

  beforeEach(() => {
    store = buildStore();
  });

  it("exposes desktop onboarding steps and default flag values", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.onboarding.steps.map(step => step.id)).toEqual([
      "create-account",
      "choose-card-type",
      "top-up-card",
      "first-purchase",
    ]);
    expect(result.current.flags.payTabEnabled).toBe(false);
    expect(result.current.flags.ptxCardEnabled).toBe(false);
  });

  it("includes apple-google-pay step when platform is native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    expect(result.current.onboarding.steps.map(step => step.id)).toEqual([
      "create-account",
      "choose-card-type",
      "top-up-card",
      "apple-google-pay",
      "first-purchase",
    ]);
  });

  it("setPayTabEnabled overrides lwdPayTab on web", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.lwdPayTab?.enabled).toBe(true);
    expect(store.getState().featureFlags.overrides.lwmPayTab).toBeUndefined();
    expect(result.current.flags.payTabEnabled).toBe(true);
  });

  it("setPayTabEnabled overrides lwmPayTab on native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.lwmPayTab?.enabled).toBe(true);
    expect(store.getState().featureFlags.overrides.lwdPayTab).toBeUndefined();
    expect(result.current.flags.payTabEnabled).toBe(true);
  });

  it("setCardParam updates params.card on lwdPayTab on web", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });
    act(() => {
      result.current.flags.setCardParam(false);
    });

    expect(store.getState().featureFlags.overrides.lwdPayTab?.params?.card).toBe(false);
    expect(store.getState().featureFlags.overrides.lwmPayTab).toBeUndefined();
    expect(result.current.flags.cardParam).toBe(false);
  });

  it("setCardParam updates params.card on lwmPayTab on native", () => {
    const { result } = renderHook(() => usePayCardToolProps({ platform: "native" }), {
      wrapper: withStore(store),
    });

    act(() => {
      result.current.flags.setPayTabEnabled(true);
    });
    act(() => {
      result.current.flags.setCardParam(false);
    });

    expect(store.getState().featureFlags.overrides.lwmPayTab?.params?.card).toBe(false);
    expect(store.getState().featureFlags.overrides.lwdPayTab).toBeUndefined();
    expect(result.current.flags.cardParam).toBe(false);
  });

  it("setPtxCardEnabled overrides ptxCard", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.flags.setPtxCardEnabled(true);
    });

    expect(store.getState().featureFlags.overrides.ptxCard?.enabled).toBe(true);
    expect(result.current.flags.ptxCardEnabled).toBe(true);
  });

  it("setStepDone toggles a single step and supports resetting all", () => {
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.onboarding.setStepDone("choose-card-type", true);
    });
    expect(result.current.onboarding.steps.find(step => step.id === "choose-card-type")?.done).toBe(
      true,
    );

    act(() => {
      result.current.onboarding.setStepDone("all", false);
    });
    expect(result.current.onboarding.steps.every(step => !step.done)).toBe(true);
  });

  it("reports no balance until the screen asks for one", () => {
    const store = buildStore();
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.balance).toMatchObject({
      baanxWallets: [],
      linkedWallets: [],
      combinedWallets: [],
      isFetching: false,
      errors: [],
    });
  });

  it("starts reading the wallets when the screen opens", () => {
    const store = buildStore();
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => result.current.balance.load());

    expect(result.current.balance.isFetching).toBe(true);
  });

  it("reads the wallets on a refresh, even as the first thing the screen does", () => {
    const store = buildStore();
    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    // Refresh both requests them and refetches, so it stands on its own: pressing it before the
    // first read has landed must not leave the screen with nothing.
    act(() => result.current.balance.refresh());

    expect(result.current.balance.isFetching).toBe(true);
  });

  it("exposes hasSeenFeatureTour from the payCard slice", () => {
    store.dispatch(markPayCardFeatureTourSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenFeatureTour).toBe(true);
  });

  it("exposes hasSeenLoginIntro from the payCard slice", () => {
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenLoginIntro).toBe(true);
  });

  it("resetPayCardFeatureTourSeen clears the seen flag", () => {
    store.dispatch(markPayCardFeatureTourSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardFeatureTourSeen();
    });

    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(false);
    expect(result.current.hasSeenFeatureTour).toBe(false);
  });

  it("exposes hasSeenReceiveVerifyHint from the request verify hint slice", () => {
    store.dispatch(markReceiveVerifyHintSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    expect(result.current.hasSeenReceiveVerifyHint).toBe(true);
  });

  it("resetReceiveVerifyHintSeen clears the seen flag", () => {
    store.dispatch(markReceiveVerifyHintSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetReceiveVerifyHintSeen();
    });

    expect(store.getState().payRequestVerifyHint.hasSeenReceiveVerifyHint).toBe(false);
    expect(result.current.hasSeenReceiveVerifyHint).toBe(false);
  });

  it("resetPayCardLoginIntroSeen clears the seen flag", () => {
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardLoginIntroSeen();
    });

    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    expect(result.current.hasSeenLoginIntro).toBe(false);
  });

  it("keeps the two reset actions apart", () => {
    store.dispatch(markPayCardFeatureTourSeen());
    store.dispatch(markPayCardLoginIntroSeen());

    const { result } = renderHook(() => usePayCardToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.resetPayCardLoginIntroSeen();
    });

    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
  });
});
