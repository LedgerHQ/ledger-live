import { renderHook } from "@testing-library/react-hooks";
import { useFeature } from "../../../../featureFlags";
import { useIsSwapLiveApp } from "./useIsSwapLiveApp";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";

// Mock dependencies.
jest.mock("../../../../featureFlags");

const useMockFeature = useFeature as jest.Mock;

const bitcoin = cryptocurrenciesById["bitcoin"];

describe("useIsSwapLiveApp hook", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("returns the enabled flag when currencyFrom is not defined", () => {
    useMockFeature.mockReturnValue({ enabled: true });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: undefined }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns the enabled flag when families and currencies are not defined", () => {
    useMockFeature.mockReturnValue({
      enabled: true,
      params: { families: undefined, currencies: undefined },
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns true when currencyFrom family is in families array and feature is enabled", () => {
    useMockFeature.mockReturnValue({
      enabled: true,
      params: { families: ["bitcoin"], currencies: [] },
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns true when currencyFrom is in currencies array and feature is enabled", () => {
    useMockFeature.mockReturnValue({
      enabled: true,
      params: { families: [], currencies: ["bitcoin"] },
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns false when currencyFrom family is not in families, currencyFrom is not in currencies, and feature is disabled", () => {
    useMockFeature.mockReturnValue({
      enabled: false,
      params: { families: ["ethereum"], currencies: ["ethereum"] },
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(false);
  });

  it("returns enabled flag if both families and currencies are empty arrays", () => {
    useMockFeature.mockReturnValue({
      enabled: true,
      params: { families: [], currencies: [] },
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });
});
