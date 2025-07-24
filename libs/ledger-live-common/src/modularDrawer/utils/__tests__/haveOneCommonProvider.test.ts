import { haveOneCommonProvider } from "../haveOneCommonProvider";
import { useGroupedCurrenciesByProvider } from "../../__mocks__/useGroupedCurrenciesByProvider.mock";
import { LoadingBasedGroupedCurrencies } from "@ledgerhq/live-common/deposit/type";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

describe("haveOneCommonProvider", () => {
  it("should return false for an empty array", () => {
    expect(haveOneCommonProvider([], [])).toBe(false);
  });

  it("should return true for a single currency with one provider", () => {
    const { result } = useGroupedCurrenciesByProvider(true) as LoadingBasedGroupedCurrencies;
    const { currenciesByProvider } = result;

    expect(haveOneCommonProvider(["bitcoin"], currenciesByProvider)).toBe(true);
  });

  it("should return false for multiple currencies with different providers", () => {
    const { result } = useGroupedCurrenciesByProvider(true) as LoadingBasedGroupedCurrencies;
    const { currenciesByProvider } = result;

    expect(haveOneCommonProvider(["bitcoin", "ethereum"], currenciesByProvider)).toBe(false);
  });

  it("should return true for multiple currencies with the same provider", () => {
    const { result } = useGroupedCurrenciesByProvider(true) as LoadingBasedGroupedCurrencies;
    const { currenciesByProvider } = result;

    expect(haveOneCommonProvider(["ethereum", "arbitrum"], currenciesByProvider)).toBe(true);
  });
});
