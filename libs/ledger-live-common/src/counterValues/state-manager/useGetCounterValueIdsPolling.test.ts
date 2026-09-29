/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { log } from "@ledgerhq/logs";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import {
  marketCountervaluesApi as api,
  defaultCounterValueIdsSortedByMarketCap,
} from "@domain/api-market-countervalues";
import { useGetCounterValueIdsPolling } from "./useGetCounterValueIdsPolling";

const idsMock = ["bitcoin", "ethereum"];

const mockUseQuery = jest.fn().mockReturnValue({ data: undefined });

jest.mock("@domain/api-market-countervalues", () => ({
  ...jest.requireActual("@domain/api-market-countervalues"),
  useGetCounterValueIdsSortedByMarketCapQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@ledgerhq/logs", () => ({
  ...jest.requireActual("@ledgerhq/logs"),
  log: jest.fn(),
}));

let store: ReturnType<typeof createTestStore>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined });
  store = createTestStore([api]);
});

afterEach(() => {
  store.dispatch(api.util.resetApiState());
});

describe("useGetCounterValueIdsPolling", () => {
  it("should return the default value before data loads", () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGetCounterValueIdsPolling(), { wrapper });

    expect(result.current).toEqual(defaultCounterValueIdsSortedByMarketCap);
  });

  it("should return fetched data once the query resolves", () => {
    mockUseQuery.mockReturnValueOnce({ data: idsMock });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGetCounterValueIdsPolling(), { wrapper });

    expect(result.current).toEqual(idsMock);
  });

  it("should pass pollingInterval and refetchOnReconnect to the query", () => {
    const wrapper = createWrapper(store);
    renderHook(() => useGetCounterValueIdsPolling(), { wrapper });

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 30 * 60 * 1000,
      refetchOnReconnect: true,
    });
  });

  it("should fall back to the default list and log when the query fails", () => {
    const error = { status: "CUSTOM_ERROR", error: "responseSchema rejected the response" };
    mockUseQuery.mockReturnValue({ data: undefined, error });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useGetCounterValueIdsPolling(), { wrapper });

    expect(result.current).toEqual(defaultCounterValueIdsSortedByMarketCap);
    expect(jest.mocked(log)).toHaveBeenCalledWith("countervaluesApi", expect.any(String), {
      error,
    });
  });
});
