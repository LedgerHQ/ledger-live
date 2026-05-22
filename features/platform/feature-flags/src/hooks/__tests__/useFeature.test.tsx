import { renderHook, act } from "@testing-library/react";
import { setOverride } from "@shared/feature-flags";
import { useFeature } from "../useFeature";
import { makeStoreWrapper, FEATURE_FLAGS_DEFAULTS } from "../../__tests__/renderWithStore";

describe("useFeature", () => {
  it("returns the resolved value seeded in the store", () => {
    const { Wrapper } = makeStoreWrapper({
      resolved: { ...FEATURE_FLAGS_DEFAULTS, mockFeature: { enabled: true } },
    });
    const { result } = renderHook(() => useFeature("mockFeature"), { wrapper: Wrapper });
    expect(result.current).toEqual({ enabled: true });
  });

  it("returns the default (disabled) value when nothing is overridden", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useFeature("mockFeature"), { wrapper: Wrapper });
    expect(result.current?.enabled).toBe(false);
  });

  it("re-renders when an override is dispatched", () => {
    const { store, Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useFeature("mockFeature"), { wrapper: Wrapper });
    expect(result.current?.enabled).toBe(false);

    act(() => {
      store.dispatch(setOverride({ key: "mockFeature", value: { enabled: true } }));
    });
    expect(result.current?.enabled).toBe(true);
  });
});
