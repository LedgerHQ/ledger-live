/**
 * @jest-environment jsdom
 */
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { renderHook } from "@testing-library/react";
import { useFeature } from "../../../../featureFlags";
import { useIsSwapLiveApp } from "./useIsSwapLiveApp";

// Mock dependencies.
jest.mock("../../../../featureFlags");

const useMockFeature = useFeature as jest.Mock;

const bitcoin = cryptocurrenciesById["bitcoin"];

describe("useIsSwapLiveApp hook", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("returns the enabled flag when currencyFrom is not defined", () => {
    // Set up the mock to return different values based on input
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveAppDemoZero") {
        return { enabled: true };
      }
      if (flagName === "ptxSwapLiveAppDemoOne") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: undefined }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns the enabled flag when families and currencies are not defined", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveAppDemoZero") {
        return { enabled: true, params: { families: undefined, currencies: undefined } };
      }
      if (flagName === "ptxSwapLiveAppDemoOne") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns true when currencyFrom family is in families array and feature is enabled", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveAppDemoZero") {
        return { enabled: true, params: { families: ["bitcoin"], currencies: [] } };
      }
      if (flagName === "ptxSwapLiveAppDemoOne") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns true when currencyFrom is in currencies array and feature is enabled", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveAppDemoZero") {
        return { enabled: true, params: { families: [], currencies: ["bitcoin"] } };
      }
      if (flagName === "ptxSwapLiveAppDemoOne") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });

  it("returns false when currencyFrom family is not in families, currencyFrom is not in currencies, and feature is disabled", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveAppDemoZero") {
        return { enabled: false, params: { families: ["ethereum"], currencies: ["ethereum"] } };
      }
      if (flagName === "ptxSwapLiveAppDemoOne") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(false);
  });

  it("returns enabled flag if both families and currencies are empty arrays", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveAppDemoZero") {
        return { enabled: true, params: { families: [], currencies: [] } };
      }
      if (flagName === "ptxSwapLiveAppDemoOne") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp({ currencyFrom: bitcoin }));

    expect(result.current.enabled).toBe(true);
  });
});
