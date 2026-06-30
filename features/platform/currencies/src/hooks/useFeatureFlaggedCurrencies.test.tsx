import { renderHook } from "@testing-library/react";
import { useFeatureFlaggedCurrencies } from "./useFeatureFlaggedCurrencies";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { makeStoreWrapper } from "../fixtures";

describe("useFeatureFlaggedCurrencies", () => {
  it("deactivates a currency whose gating flag is disabled by default", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useFeatureFlaggedCurrencies(), { wrapper: Wrapper });
    expect(result.current.featureFlaggedCurrencies.aleo).toBeDefined();
    expect(result.current.deactivatedCurrencyIds.has("aleo")).toBe(true);
  });

  it("stops deactivating a currency once its gating flag is enabled", () => {
    const { Wrapper } = makeStoreWrapper({
      resolved: { ...FEATURE_FLAGS_DEFAULTS, currencyAleo: { enabled: true } },
    });
    const { result } = renderHook(() => useFeatureFlaggedCurrencies(), { wrapper: Wrapper });
    expect(result.current.deactivatedCurrencyIds.has("aleo")).toBe(false);
  });

  it("deactivates nothing in mock mode", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useFeatureFlaggedCurrencies(true), { wrapper: Wrapper });
    expect(result.current.deactivatedCurrencyIds.size).toBe(0);
  });
});
