/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { defaultCounterValueIdsSortedByMarketCap } from "@domain/api-market-countervalues";
import { setCountervaluesLogger } from "./setCountervaluesLogger";
import { useGetCounterValueIdsPolling } from "./useGetCounterValueIdsPolling";

const idsMock = ["bitcoin", "ethereum"];

const mockUseQuery = jest.fn().mockReturnValue({ data: undefined });

jest.mock("@domain/api-market-countervalues", () => ({
  ...jest.requireActual("@domain/api-market-countervalues"),
  useGetCounterValueIdsSortedByMarketCapQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const log = jest.fn();
setCountervaluesLogger(log);

beforeEach(() => {
  jest.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined });
});

describe("useGetCounterValueIdsPolling", () => {
  it("should return the default value before data loads", () => {
    const { result } = renderHook(() => useGetCounterValueIdsPolling());

    expect(result.current).toEqual(defaultCounterValueIdsSortedByMarketCap);
  });

  it("should return fetched data once the query resolves", () => {
    mockUseQuery.mockReturnValueOnce({ data: idsMock });

    const { result } = renderHook(() => useGetCounterValueIdsPolling());

    expect(result.current).toEqual(idsMock);
  });

  it("should pass pollingInterval and refetchOnReconnect to the query", () => {
    renderHook(() => useGetCounterValueIdsPolling());

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 30 * 60 * 1000,
      refetchOnReconnect: true,
    });
  });

  it("should fall back to the default list and log when the query fails", () => {
    const error = { status: "CUSTOM_ERROR", error: "responseSchema rejected the response" };
    mockUseQuery.mockReturnValue({ data: undefined, error });

    const { result } = renderHook(() => useGetCounterValueIdsPolling());

    expect(result.current).toEqual(defaultCounterValueIdsSortedByMarketCap);
    expect(jest.mocked(log)).toHaveBeenCalledWith("countervaluesApi", expect.any(String), {
      error,
    });
  });
});
