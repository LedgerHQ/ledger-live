import { renderHook } from "@tests/test-renderer";
import { useNonBlacklistedDistributionResult } from "~/hooks/useNonBlacklistedDistribution";
import { useDetailedAllocationViewModel } from "./useDetailedAllocationViewModel";

jest.mock("~/hooks/useNonBlacklistedDistribution", () => ({
  useNonBlacklistedDistributionResult: jest.fn(),
}));

const mockUseDistribution = jest.mocked(useNonBlacklistedDistributionResult);

describe("useDetailedAllocationViewModel", () => {
  it.each([
    { isLoading: true, countervalueComplete: true, expectedLoading: true },
    { isLoading: false, countervalueComplete: false, expectedLoading: false },
  ])("does not expose a partial distribution: %o", config => {
    mockUseDistribution.mockReturnValue({
      isAvailable: true,
      countervalueComplete: config.countervalueComplete,
      showFirst: 0,
      sum: 0,
      list: [],
      isLoading: config.isLoading,
    });

    const { result } = renderHook(() => useDetailedAllocationViewModel());

    expect(result.current.isCountervalueComplete).toBe(false);
    expect(result.current.isLoading).toBe(config.expectedLoading);
    expect(result.current.list).toEqual([]);
  });
});
