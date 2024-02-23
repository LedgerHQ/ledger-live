import "../__tests__/test-helpers/setup";
import { renderHook, waitFor } from "@testing-library/react";
import { useGroupedCurrenciesByProvider } from ".";

test("list is starting with Bitcoin", async () => {
  const { result } = renderHook(() => useGroupedCurrenciesByProvider());

  await waitFor(() =>
    expect(result.current.sortedCryptoCurrencies.slice(0, 1).map(o => o.id)).toMatchObject([
      "bitcoin",
    ]),
  );
});
