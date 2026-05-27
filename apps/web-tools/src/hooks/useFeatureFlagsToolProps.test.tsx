import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, {
  createFeatureFlagsMiddleware,
  featureFlagsOverridesSelector,
} from "@shared/feature-flags";
import { useFeatureFlagsToolProps } from "./useFeatureFlagsToolProps";

function buildStore() {
  return configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    middleware: gdm => gdm().concat(createFeatureFlagsMiddleware({ resolutionConfig: {} })),
  });
}

function withStore(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
}

describe("useFeatureFlagsToolProps", () => {
  it("returns the resolved and overrides slices from the store", () => {
    const store = buildStore();
    const { result } = renderHook(() => useFeatureFlagsToolProps(), { wrapper: withStore(store) });

    expect(result.current.overrides).toEqual(featureFlagsOverridesSelector(store.getState()));
    expect(result.current.resolved).toEqual(store.getState().featureFlags.resolved);
  });

  it("setOverride dispatches and updates the overrides slice", () => {
    const store = buildStore();
    const { result } = renderHook(() => useFeatureFlagsToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.setOverride("mockFeature", { enabled: true });
    });

    expect(store.getState().featureFlags.overrides).toEqual({ mockFeature: { enabled: true } });
    expect(result.current.overrides).toEqual({ mockFeature: { enabled: true } });
  });

  it("clearOverride removes a single override", () => {
    const store = buildStore();
    const { result } = renderHook(() => useFeatureFlagsToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.setOverride("mockFeature", { enabled: true });
    });
    expect(store.getState().featureFlags.overrides).toHaveProperty("mockFeature");

    act(() => {
      result.current.clearOverride("mockFeature");
    });
    expect(store.getState().featureFlags.overrides).not.toHaveProperty("mockFeature");
  });

  it("clearAllOverrides empties the overrides slice", () => {
    const store = buildStore();
    const { result } = renderHook(() => useFeatureFlagsToolProps(), { wrapper: withStore(store) });

    act(() => {
      result.current.setOverride("mockFeature", { enabled: true });
    });
    expect(store.getState().featureFlags.overrides).toHaveProperty("mockFeature");

    act(() => {
      result.current.clearAllOverrides();
    });
    expect(store.getState().featureFlags.overrides).toEqual({});
  });
});
