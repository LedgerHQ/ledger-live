import { renderHook } from "@testing-library/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useGetTokensDataInfiniteQuery } from "@domain/api-currency-token";
import { useTokensData } from "./useTokensData";

jest.mock("@domain/api-currency-token", () => ({
  useGetTokensDataInfiniteQuery: jest.fn(),
}));

const mockQuery = useGetTokensDataInfiniteQuery as unknown as jest.Mock;

const token = (id: string) => ({ id }) as unknown as TokenCurrency;

function mockResult(overrides: Record<string, unknown>) {
  mockQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: undefined,
    fetchNextPage: jest.fn(),
    isSuccess: true,
    refetch: jest.fn(),
    isFetching: false,
    isError: false,
    isFetchingNextPage: false,
    ...overrides,
  });
}

describe("useTokensData", () => {
  it("joins pages and exposes loadNext when more pages remain", () => {
    const fetchNextPage = jest.fn();
    mockResult({
      data: {
        pages: [
          { tokens: [token("a")], pagination: { nextCursor: "c1" } },
          { tokens: [token("b")], pagination: { nextCursor: "c2" } },
        ],
      },
      fetchNextPage,
    });

    const { result } = renderHook(() => useTokensData({}));

    expect(result.current.data?.tokens.map(t => t.id)).toEqual(["a", "b"]);
    expect(result.current.data?.pagination.nextCursor).toBe("c2");
    expect(result.current.loadNext).toBe(fetchNextPage);
  });

  it("has no loadNext on the last page", () => {
    mockResult({
      data: { pages: [{ tokens: [token("a")], pagination: {} }] },
    });
    const { result } = renderHook(() => useTokensData({}));
    expect(result.current.loadNext).toBeUndefined();
  });

  it("reports initial loading but not while paginating", () => {
    mockResult({ isLoading: true });
    expect(renderHook(() => useTokensData({})).result.current.isLoading).toBe(true);

    mockResult({ isFetching: true, isFetchingNextPage: true });
    expect(renderHook(() => useTokensData({})).result.current.isLoading).toBe(false);
  });

  it("returns undefined data before the first page resolves", () => {
    mockResult({ data: undefined });
    expect(renderHook(() => useTokensData({})).result.current.data).toBeUndefined();
  });
});
