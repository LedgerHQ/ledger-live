import { renderHook, act } from "@testing-library/react";
import { setOverride, setAllOverrides } from "@shared/feature-flags";
import { useHasLocallyOverriddenFeatureFlags } from "../useHasLocallyOverriddenFeatureFlags";
import { makeStoreWrapper } from "../../__tests__/renderWithStore";

describe("useHasLocallyOverriddenFeatureFlags", () => {
  it("is false with no overrides in the store", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useHasLocallyOverriddenFeatureFlags(), {
      wrapper: Wrapper,
    });
    expect(result.current).toBe(false);
  });

  it("is true after dispatching setOverride", () => {
    const { store, Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useHasLocallyOverriddenFeatureFlags(), {
      wrapper: Wrapper,
    });
    expect(result.current).toBe(false);

    act(() => {
      store.dispatch(setOverride({ key: "mockFeature", value: { enabled: true } }));
    });
    expect(result.current).toBe(true);
  });

  it("is false after clearing the override via setOverride with undefined", () => {
    const { store, Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useHasLocallyOverriddenFeatureFlags(), {
      wrapper: Wrapper,
    });

    act(() => {
      store.dispatch(setOverride({ key: "mockFeature", value: { enabled: true } }));
    });
    expect(result.current).toBe(true);

    act(() => {
      store.dispatch(setOverride({ key: "mockFeature", value: undefined }));
    });
    expect(result.current).toBe(false);
  });

  it("is true after setAllOverrides with entries, false after clearing", () => {
    const { store, Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useHasLocallyOverriddenFeatureFlags(), {
      wrapper: Wrapper,
    });

    act(() => {
      store.dispatch(setAllOverrides({ mockFeature: { enabled: false } }));
    });
    expect(result.current).toBe(true);

    act(() => {
      store.dispatch(setAllOverrides({}));
    });
    expect(result.current).toBe(false);
  });
});
