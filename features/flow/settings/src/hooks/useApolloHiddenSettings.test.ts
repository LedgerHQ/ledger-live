import { act, renderHook } from "@testing-library/react";
import { setOverride } from "@shared/feature-flags";
import { makeFeatureFlagsStore } from "../__tests__/featureFlagsStore";
import { useApolloHiddenSettings } from "./useApolloHiddenSettings";

const BOTH_ROWS = ["myLedgerProvider", "mockAppUpdate"];

describe("useApolloHiddenSettings", () => {
  it("hides both rows on Apollo, with the default flag", () => {
    const { Wrapper } = makeFeatureFlagsStore();

    const { result } = renderHook(() => useApolloHiddenSettings(true), { wrapper: Wrapper });

    expect(result.current).toEqual(BOTH_ROWS);
  });

  it("hides nothing off Apollo with the default flag", () => {
    const { Wrapper } = makeFeatureFlagsStore();

    const { result } = renderHook(() => useApolloHiddenSettings(false), { wrapper: Wrapper });

    expect(result.current).toEqual([]);
  });

  it("hides off Apollo the rows whose param is true while the flag is on", () => {
    const { Wrapper } = makeFeatureFlagsStore({
      enabled: true,
      params: { hideMyLedgerProvider: false, hideMockAppUpdate: true },
    });

    const { result } = renderHook(() => useApolloHiddenSettings(false), { wrapper: Wrapper });

    expect(result.current).toEqual(["mockAppUpdate"]);
  });

  it("ignores the params while the flag is off", () => {
    const { Wrapper } = makeFeatureFlagsStore({
      enabled: false,
      params: { hideMyLedgerProvider: true, hideMockAppUpdate: true },
    });

    const { result } = renderHook(() => useApolloHiddenSettings(false), { wrapper: Wrapper });

    expect(result.current).toEqual([]);
  });

  it("follows a flag override dispatched while mounted", () => {
    const { store, Wrapper } = makeFeatureFlagsStore();
    const { result } = renderHook(() => useApolloHiddenSettings(false), { wrapper: Wrapper });
    expect(result.current).toEqual([]);

    act(() => {
      store.dispatch(
        setOverride({
          key: "newSettings",
          value: { enabled: true, params: { hideMyLedgerProvider: true, hideMockAppUpdate: true } },
        }),
      );
    });

    expect(result.current).toEqual(BOTH_ROWS);
  });

  it("keeps the same list between renders while nothing changes", () => {
    const { Wrapper } = makeFeatureFlagsStore();
    const { result, rerender } = renderHook(() => useApolloHiddenSettings(true), {
      wrapper: Wrapper,
    });
    const firstList = result.current;

    rerender();

    expect(result.current).toBe(firstList);
  });
});
