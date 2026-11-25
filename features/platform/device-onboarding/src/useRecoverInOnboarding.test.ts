/**
 * @jest-environment jsdom
 */
import { createElement, type ComponentType, type ReactNode } from "react";
import { configureStore, type Store } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type Features,
} from "@shared/feature-flags";
import { useRecoverInOnboarding } from "./useRecoverInOnboarding";

// The children go as createElement's third argument, which Provider's own props type does not allow for.
const StoreProvider = Provider as ComponentType<{ store: Store; children?: ReactNode }>;

function renderWithFlag(deviceOnboarding?: Features["deviceOnboarding"]) {
  const resolved: Features = {
    ...FEATURE_FLAGS_DEFAULTS,
    ...(deviceOnboarding ? { deviceOnboarding } : undefined),
  };
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: { featureFlags: { ...FEATURE_FLAGS_INITIAL_STATE, resolved } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(StoreProvider, { store }, children);

  return renderHook(() => useRecoverInOnboarding(), { wrapper });
}

function renderWithParams(params: { offerLedgerSync: boolean; recover?: boolean }) {
  return renderWithFlag({ enabled: true, params } as Features["deviceOnboarding"]);
}

describe("useRecoverInOnboarding", () => {
  it("should show Recover by default", () => {
    const { result } = renderWithFlag();

    expect(result.current).toBe(true);
  });

  it("should show Recover when a saved value predates the param", () => {
    const { result } = renderWithParams({ offerLedgerSync: false });

    expect(result.current).toBe(true);
  });

  it("should show Recover when the param is on", () => {
    const { result } = renderWithParams({ offerLedgerSync: false, recover: true });

    expect(result.current).toBe(true);
  });

  it("should hide Recover when the param is off", () => {
    const { result } = renderWithParams({ offerLedgerSync: false, recover: false });

    expect(result.current).toBe(false);
  });
});
