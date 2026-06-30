import { renderHook } from "@testing-library/react";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { useSupportedCurrencies } from "./useSupportedCurrencies";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { makeStoreWrapper } from "../fixtures";

const bitcoin = CRYPTO_CURRENCIES_REGISTRY.bitcoin; // not feature-flagged
const aleo = CRYPTO_CURRENCIES_REGISTRY.aleo; // gated by currencyAleo
const base = [bitcoin, aleo];

describe("useSupportedCurrencies", () => {
  it("drops a currency whose gating flag is disabled (default)", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useSupportedCurrencies(base), { wrapper: Wrapper });
    expect(result.current).toEqual([bitcoin]);
  });

  it("keeps a currency once its gating flag is enabled", () => {
    const { Wrapper } = makeStoreWrapper({
      resolved: { ...FEATURE_FLAGS_DEFAULTS, currencyAleo: { enabled: true } },
    });
    const { result } = renderHook(() => useSupportedCurrencies(base), { wrapper: Wrapper });
    expect(result.current).toEqual([bitcoin, aleo]);
  });

  it("keeps every currency in mock mode regardless of flags", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useSupportedCurrencies(base, { mock: true }), {
      wrapper: Wrapper,
    });
    expect(result.current).toEqual([bitcoin, aleo]);
  });

  it("never gates a currency that has no feature flag", () => {
    const { Wrapper } = makeStoreWrapper();
    const { result } = renderHook(() => useSupportedCurrencies([bitcoin]), { wrapper: Wrapper });
    expect(result.current).toEqual([bitcoin]);
  });
});
