import "../__tests__/test-helpers/setup";
import { renderHook } from "@testing-library/react-hooks";
import { useGroupedCurrenciesByProvider } from ".";

test("list is starting with Bitcoin", async () => {
  const { waitForNextUpdate, result } = renderHook(() => useGroupedCurrenciesByProvider());
  await waitForNextUpdate();
  expect(result.current.sortedCryptoCurrencies.slice(0, 1).map(o => o.id)).toMatchObject([
    "bitcoin",
  ]);
});
