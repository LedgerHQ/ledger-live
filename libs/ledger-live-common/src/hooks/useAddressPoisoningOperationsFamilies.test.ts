/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { getEnv } from "@ledgerhq/live-env";
import * as featureFlags from "../featureFlags";
import { useAddressPoisoningOperationsFamilies } from "./useAddressPoisoningOperationsFamilies";

jest.mock("../featureFlags", () => ({
  ...jest.requireActual("../featureFlags"),
  useFeature: jest.fn(),
}));
jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn(),
}));

describe("useAddressPoisoningOperationsFamilies", () => {
  const mockedUseFeature = jest.mocked(featureFlags.useFeature);
  const mockedGetEnv = jest.mocked(getEnv);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetEnv.mockReturnValue("evm,tron");
  });

  it("returns null when shouldFilter is false", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { families: ["evm", "tron"] },
    });

    const { result } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: false }),
    );

    expect(result.current).toBe(null);
    expect(mockedUseFeature).toHaveBeenCalledWith("addressPoisoningOperationsFilter");
    expect(mockedGetEnv).not.toHaveBeenCalled();
  });

  it("returns getEnv fallback when feature is disabled", () => {
    mockedUseFeature.mockReturnValue({
      enabled: false,
      params: { families: ["evm", "tron"] },
    });
    mockedGetEnv.mockReturnValue("evm,tron");

    const { result } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: true }),
    );

    expect(result.current).toEqual(["evm", "tron"]);
    expect(mockedGetEnv).toHaveBeenCalledWith("ADDRESS_POISONING_FAMILIES");
  });

  it("returns getEnv fallback when feature is null/undefined", () => {
    mockedUseFeature.mockReturnValue(null);
    mockedGetEnv.mockReturnValue("evm,tron");

    const { result } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: true }),
    );

    expect(result.current).toEqual(["evm", "tron"]);
    expect(mockedGetEnv).toHaveBeenCalledWith("ADDRESS_POISONING_FAMILIES");
  });

  it("returns array from feature params when enabled with non-empty families", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { families: ["evm", "tron", "solana"] },
    });

    const { result } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: true }),
    );

    expect(result.current).not.toBe(null);
    expect(result.current).toBeInstanceOf(Array);
    expect(result.current?.length).toBe(3);
    expect(result.current).toEqual(["evm", "tron", "solana"]);
    expect(mockedGetEnv).not.toHaveBeenCalled();
  });

  it("returns empty array when feature has empty families", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { families: [] },
    });

    const { result } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: true }),
    );

    expect(result.current).toEqual([]);
    expect(mockedGetEnv).not.toHaveBeenCalled();
  });

  it("returns null when feature params has no families", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: {},
    });

    const { result } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: true }),
    );

    expect(result.current).toBe(null);
    expect(mockedGetEnv).not.toHaveBeenCalled();
  });

  it("trims family values when using getEnv fallback", () => {
    mockedUseFeature.mockReturnValue({ enabled: false, params: {} });
    mockedGetEnv.mockReturnValue(" evm , tron , solana ");

    const { result } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: true }),
    );

    expect(result.current).toEqual(["evm", "tron", "solana"]);
  });

  it("returns stable array reference when dependencies do not change", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { families: ["evm", "tron"] },
    });

    const { result, rerender } = renderHook(() =>
      useAddressPoisoningOperationsFamilies({ shouldFilter: true }),
    );

    const firstArray = result.current;
    rerender();
    const secondArray = result.current;

    expect(firstArray).toBe(secondArray);
  });
});
