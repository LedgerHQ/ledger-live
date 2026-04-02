/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import * as featureFlags from "../../featureFlags";
import { MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD } from "../smallValueOperationsThreshold";
import { useHideSmallValueTokenOperationsEnabled } from "./useHideSmallValueTokenOperationsEnabled";

jest.mock("../../featureFlags", () => ({
  ...jest.requireActual("../../featureFlags"),
  useFeature: jest.fn(),
}));

describe("useHideSmallValueTokenOperationsEnabled", () => {
  const mockedUseFeature = jest.mocked(featureFlags.useFeature);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns enabled:true and default threshold when the flag is enabled without params", () => {
    mockedUseFeature.mockReturnValue({ enabled: true });

    const { result } = renderHook(() => useHideSmallValueTokenOperationsEnabled());

    expect(result.current.enabled).toBe(true);
    expect(result.current.thresholdUsd).toBe(MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD);
    expect(mockedUseFeature).toHaveBeenCalledWith("lldHideSmallValueTokenOperations");
  });

  it("returns the Firebase threshold when params.thresholdUsd is provided", () => {
    mockedUseFeature.mockReturnValue({ enabled: true, params: { thresholdUsd: 0.25 } });

    const { result } = renderHook(() => useHideSmallValueTokenOperationsEnabled());

    expect(result.current.enabled).toBe(true);
    expect(result.current.thresholdUsd).toBe(0.25);
  });

  it("returns enabled:false and default threshold when the flag is disabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: false });

    const { result } = renderHook(() => useHideSmallValueTokenOperationsEnabled());

    expect(result.current.enabled).toBe(false);
    expect(result.current.thresholdUsd).toBe(MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD);
  });

  it("returns enabled:false and default threshold when the flag is null", () => {
    mockedUseFeature.mockReturnValue(null);

    const { result } = renderHook(() => useHideSmallValueTokenOperationsEnabled());

    expect(result.current.enabled).toBe(false);
    expect(result.current.thresholdUsd).toBe(MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD);
  });

  it("returns default threshold when params exist but thresholdUsd is absent", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: {},
    } as ReturnType<typeof featureFlags.useFeature>);

    const { result } = renderHook(() => useHideSmallValueTokenOperationsEnabled());

    expect(result.current.thresholdUsd).toBe(MAX_SMALL_VALUE_OPERATIONS_THRESHOLD_USD);
  });
});
