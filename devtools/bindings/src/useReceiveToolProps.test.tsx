import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { useReceiveToolProps } from "./useReceiveToolProps";

function buildStore() {
  return configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    middleware: gdm => gdm().concat(createFeatureFlagsMiddleware({ resolutionConfig: {} })),
  });
}

function renderTool() {
  const store = buildStore();
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useReceiveToolProps(), { wrapper });
  return { store, result };
}

describe("useReceiveToolProps", () => {
  it("reads the flag off with no excluded family by default", () => {
    const { result } = renderTool();

    expect(result.current.flag.enabled).toBe(false);
    expect(result.current.flag.excludedFamilies).toEqual([]);
  });

  it("turns the flag on and keeps the excluded families", () => {
    const { store, result } = renderTool();

    act(() => result.current.flag.setExcludedFamilies(["tron"]));
    act(() => result.current.flag.setEnabled(true));

    expect(store.getState().featureFlags.overrides.newReceiveFlow).toEqual({
      enabled: true,
      params: { excludedFamilies: ["tron"] },
    });
    expect(result.current.flag).toMatchObject({ enabled: true, excludedFamilies: ["tron"] });
  });
});
