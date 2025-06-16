/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useFeature } from "../../../../featureFlags";
import { useIsSwapLiveApp } from "./useIsSwapLiveApp";

// Mock dependencies.
jest.mock("../../../../featureFlags");

const useMockFeature = useFeature as jest.Mock;

describe("useIsSwapLiveApp hook", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("returns the enabled flag when currencyFrom is not defined", () => {
    // Set up the mock to return different values based on input
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveApp") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp());

    expect(result.current.enabled).toBe(true);
  });

  it("returns the enabled flag when families and currencies are not defined", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveApp") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp());

    expect(result.current.enabled).toBe(true);
  });

  it("returns true when currencyFrom family is in families array and feature is enabled", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveApp") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp());

    expect(result.current.enabled).toBe(true);
  });

  it("returns true when currencyFrom is in currencies array and feature is enabled", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveApp") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp());

    expect(result.current.enabled).toBe(true);
  });

  it("returns enabled flag if both families and currencies are empty arrays", () => {
    useMockFeature.mockImplementation(flagName => {
      if (flagName === "ptxSwapLiveApp") {
        return { enabled: false };
      }
    });

    const { result } = renderHook(() => useIsSwapLiveApp());

    expect(result.current.enabled).toBe(true);
  });
});
