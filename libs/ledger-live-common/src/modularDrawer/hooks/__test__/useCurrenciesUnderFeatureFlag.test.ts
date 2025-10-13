/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useCurrenciesUnderFeatureFlag } from "../useCurrenciesUnderFeatureFlag";
import { useFeature } from "../../../featureFlags";
import useEnv from "../../../hooks/useEnv";

jest.mock("../../../featureFlags", () => ({ useFeature: jest.fn() }));
jest.mock("../../../hooks/useEnv", () => jest.fn());

const mockUseFeature = jest.mocked(useFeature);
const mockedEnvironment = jest.mocked(useEnv);

describe("useCurrenciesUnderFeatureFlag", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty deactivatedCurrencyIds when all features are enabled", () => {
    mockedEnvironment.mockReturnValue(false);
    mockUseFeature.mockReturnValue({ enabled: true });

    const { result } = renderHook(() => useCurrenciesUnderFeatureFlag());

    expect(result.current.deactivatedCurrencyIds.size).toEqual(0);
    expect(result.current.featureFlaggedCurrencies).toBeDefined();
  });

  it("should include disabled currencies in deactivatedCurrencyIds", () => {
    mockedEnvironment.mockReturnValue(false);
    mockUseFeature.mockReturnValue({ enabled: false });

    const { result } = renderHook(() => useCurrenciesUnderFeatureFlag());

    expect(result.current.deactivatedCurrencyIds.size).toBeGreaterThan(0);
  });

  it("should return empty deactivatedCurrencyIds when MOCK is true", () => {
    mockedEnvironment.mockReturnValue(true);
    mockUseFeature.mockReturnValue({ enabled: false });

    const { result } = renderHook(() => useCurrenciesUnderFeatureFlag());

    expect(result.current.deactivatedCurrencyIds.size).toBe(0);
  });

  it("should contain currency mappings", () => {
    mockedEnvironment.mockReturnValue(false);
    mockUseFeature.mockReturnValue({ enabled: true });

    const { result } = renderHook(() => useCurrenciesUnderFeatureFlag());

    const currencies = result.current.featureFlaggedCurrencies;
    expect(currencies).toHaveProperty("aptos");
    expect(currencies).toHaveProperty("stacks");
    expect(currencies).toHaveProperty("optimism");
  });
});
