import { renderHook, waitFor } from "@tests/test-renderer";
import { useMarketCoinData, useMarketCoinDataWithChart } from "../useMarketCoinData";
import { withMarketState } from "../../__tests__/helpers";

describe("useMarketCoinData hooks", () => {
  it.each([
    { counterCurrency: "eur", expected: "eur" },
    { counterCurrency: undefined, expected: "usd" },
  ])(
    "useMarketCoinData should return counterCurrency=$expected when Redux value is $counterCurrency",
    ({ counterCurrency, expected }) => {
      const { result } = renderHook(
        () => useMarketCoinData({ currencyId: "bitcoin" }),
        withMarketState({ marketParams: { counterCurrency } }),
      );

      expect(result.current.counterCurrency).toBe(expected);
    },
  );

  it.each([
    { range: "7d" as const, expected: "7d" },
    { range: undefined, expected: "24h" },
  ])(
    "useMarketCoinDataWithChart should return range=$expected when Redux value is $range",
    ({ range, expected }) => {
      const { result } = renderHook(
        () => useMarketCoinDataWithChart({ currencyId: "bitcoin" }),
        withMarketState({ marketParams: { range } }),
      );

      expect(result.current.range).toBe(expected);
    },
  );

  it("useMarketCoinData should expose loading state and refetch", async () => {
    const { result } = renderHook(() => useMarketCoinData({ currencyId: "bitcoin" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.refetch).toBeInstanceOf(Function);
  });

  it("useMarketCoinDataWithChart should expose marketParams and counterCurrency from Redux", () => {
    const { result } = renderHook(
      () => useMarketCoinDataWithChart({ currencyId: "bitcoin" }),
      withMarketState({ marketParams: { counterCurrency: "eur" } }),
    );

    expect(result.current.counterCurrency).toBe("eur");
    expect(result.current.marketParams).toEqual(
      expect.objectContaining({ counterCurrency: "eur" }),
    );
  });
});
