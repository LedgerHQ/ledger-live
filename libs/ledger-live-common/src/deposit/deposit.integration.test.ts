/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/setup";
import { renderHook, waitFor } from "@testing-library/react";
import { useGroupedCurrenciesByProvider } from ".";
import { GroupedCurrencies, LoadingBasedGroupedCurrencies } from "./type";
// Explicitly mock the featureFlags module

describe("useGroupedCurrenciesByProvider", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should list is starting with Bitcoin", async () => {
    const { result } = renderHook(() => useGroupedCurrenciesByProvider());
    await waitFor(() =>
      expect(
        (result.current as GroupedCurrencies).sortedCryptoCurrencies.slice(0, 1).map(o => o.id),
      ).toMatchObject(["bitcoin"]),
    );
  });

  it("should list is starting with Bitcoin when withLoading is activated", async () => {
    const { result: hookRef } = renderHook(() => useGroupedCurrenciesByProvider(true));

    await waitFor(() =>
      expect(
        (hookRef.current as LoadingBasedGroupedCurrencies).result.sortedCryptoCurrencies
          .slice(0, 1)
          .map(o => o.id),
      ).toMatchObject(["bitcoin"]),
    );
  });
});
