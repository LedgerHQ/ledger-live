import { renderHook } from "@testing-library/react";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { useCryptoCurrencyById } from "./useCryptoCurrencyById";

describe("useCryptoCurrencyById", () => {
  it("returns the registry entry for a known id", () => {
    const { result } = renderHook(() => useCryptoCurrencyById("bitcoin"));
    expect(result.current).toBe(CRYPTO_CURRENCIES_REGISTRY.bitcoin);
    expect(result.current?.id).toBe("bitcoin");
  });

  it("returns undefined for an unknown id", () => {
    const { result } = renderHook(() => useCryptoCurrencyById("not-a-currency"));
    expect(result.current).toBeUndefined();
  });

  it("returns undefined when no id is given", () => {
    const { result } = renderHook(() => useCryptoCurrencyById(undefined));
    expect(result.current).toBeUndefined();
  });
});
