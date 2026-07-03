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
  let store: ReturnType<typeof buildStore>;
  let result: ReturnType<
    typeof renderHook<ReturnType<typeof useFeatureFlagsToolProps>, void>
  >["result"];

  beforeEach(() => {
    store = buildStore();
    ({ result } = renderHook(() => useFeatureFlagsToolProps(), { wrapper: withStore(store) }));
  });

  it("returns the resolved and overrides slices from the store", () => {
    expect(result.current.overrides).toEqual(featureFlagsOverridesSelector(store.getState()));
    expect(result.current.resolved).toEqual(store.getState().featureFlags.resolved);
  });

  it("setOverride dispatches and updates the overrides slice", () => {
    act(() => {
      result.current.setOverride("mockFeature", { enabled: true });
    });

    expect(store.getState().featureFlags.overrides).toEqual({ mockFeature: { enabled: true } });
    expect(result.current.overrides).toEqual({ mockFeature: { enabled: true } });
  });

  it("setAllOverrides replaces the whole overrides slice", () => {
    act(() => {
      result.current.setAllOverrides({ mockFeature: { enabled: true } });
    });

    expect(store.getState().featureFlags.overrides).toEqual({ mockFeature: { enabled: true } });
  });

  it("clearOverride removes a single override", () => {
    act(() => {
      result.current.setOverride("mockFeature", { enabled: true });
    });
    act(() => {
      result.current.clearOverride("mockFeature");
    });
    expect(store.getState().featureFlags.overrides).not.toHaveProperty("mockFeature");
  });

  it("clearAllOverrides empties the overrides slice", () => {
    act(() => {
      result.current.setOverride("mockFeature", { enabled: true });
    });
    act(() => {
      result.current.clearAllOverrides();
    });
    expect(store.getState().featureFlags.overrides).toEqual({});
  });
});
