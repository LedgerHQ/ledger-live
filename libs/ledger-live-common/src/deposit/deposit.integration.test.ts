/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useGroupedCurrenciesByProvider } from ".";
import "../__tests__/test-helpers/setup";
// Explicitly mock the featureFlags module

describe("useGroupedCurrenciesByProvider", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should list is starting with Bitcoin", async () => {
    const { result } = renderHook(() => useGroupedCurrenciesByProvider(false));
    await waitFor(() =>
      expect(result.current.sortedCryptoCurrencies.slice(0, 1).map(o => o.id)).toMatchObject([
        "bitcoin",
      ]),
    );
  });

  it("should list is starting with Bitcoin when withLoading is activated", async () => {
    const { result: hookRef } = renderHook(() => useGroupedCurrenciesByProvider(true));

    await waitFor(() =>
      expect(
        hookRef.current.result.sortedCryptoCurrencies.slice(0, 1).map(o => o.id),
      ).toMatchObject(["bitcoin"]),
    );
  });
});
