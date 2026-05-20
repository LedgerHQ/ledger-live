import { renderHook, act } from "@testing-library/react";
import { setOverride } from "@shared/feature-flags";
import { useFeatureFlags } from "../useFeatureFlags";
import { makeStoreWrapper } from "../../__tests__/renderWithStore";

describe("useFeatureFlags", () => {
  it("returns the entire resolved feature-flag map", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useFeatureFlags(), { wrapper: Wrapper });
    expect(result.current).toMatchObject({ mockFeature: { enabled: false } });
  });

  it("reflects updates after a dispatched override", () => {
    const { store, Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useFeatureFlags(), { wrapper: Wrapper });
    expect(result.current.mockFeature.enabled).toBe(false);

    act(() => {
      store.dispatch(setOverride({ key: "mockFeature", value: { enabled: true } }));
    });
    expect(result.current.mockFeature.enabled).toBe(true);
  });
});
