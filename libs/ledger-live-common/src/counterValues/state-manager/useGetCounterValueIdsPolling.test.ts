/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import { counterValuesApi as api } from "./api";
import { defaultCounterValueIdsSortedByMarketCap, idsMock } from "./schema";
import { useGetCounterValueIdsPolling } from "./useGetCounterValueIdsPolling";

const mockUseQuery = jest.fn().mockReturnValue({ data: undefined });

jest.mock("./api", () => ({
  ...jest.requireActual("./api"),
  useGetCounterValueIdsSortedByMarketCapQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

let store: ReturnType<typeof createTestStore>;

beforeEach(() => {
  jest.clearAllMocks();
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
});
