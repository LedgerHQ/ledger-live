/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useTokensData } from "../useTokensData";
import { useGetTokensDataInfiniteQuery } from "../../state-manager/api";

jest.mock("../../state-manager/api", () => ({
  useGetTokensDataInfiniteQuery: jest.fn(),
}));

const mockUseGetTokensDataInfiniteQuery = jest.mocked(useGetTokensDataInfiniteQuery);

const defaultMockValues = {
  data: undefined,
  isLoading: false,
  error: undefined,
  fetchNextPage: jest.fn(),
  isSuccess: true,
  isFetching: false,
  isError: false,
  fetchPreviousPage: jest.fn(),
  isFetchingPreviousPage: false,
  refetch: jest.fn(),
  status: "success",
};

describe("useAssetsData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state when API is loading", () => {
    mockUseGetTokensDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      isLoading: true,
      status: "pending",
    });

    const { result } = renderHook(() =>
      useTokensData({
        networkFamily: "ethereum",
        pageSize: 100,
        output: ["id", "name", "ticker", "contract_address"],
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBe(undefined);
  });

  it("should return combined data from multiple pages", () => {
    const mockPages = [
      {
        tokens: [
          {
            id: "token-1",
            name: "Token 1",
            ticker: "T1",
            contractAddress: "0x123",
            parentCurrency: { id: "currency-1", name: "Currency 1" },
          },
          {
            id: "token-2",
            name: "Token 2",
            ticker: "T2",
            contractAddress: "0x456",
            parentCurrency: { id: "currency-2", name: "Currency 2" },
          },
        ],
        pagination: { nextCursor: "cursor-2" },
      },
      {
        tokens: [
          {
            id: "token-3",
            name: "Token 3",
            ticker: "T3",
            contractAddress: "0x789",
            parentCurrency: { id: "currency-3", name: "Currency 3" },
          },
        ],
        pagination: { nextCursor: undefined },
      },
    ];

    mockUseGetTokensDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: mockPages, pageParams: [{ cursor: "" }, { cursor: "cursor-2" }] },
    });

    const { result } = renderHook(() =>
      useTokensData({
        networkFamily: "ethereum",
        pageSize: 100,
        output: ["id", "name", "ticker", "contract_address"],
      }),
    );

    expect(result.current.data).toEqual({
      tokens: [
        {
          id: "token-1",
          name: "Token 1",
          ticker: "T1",
          contractAddress: "0x123",
          parentCurrency: { id: "currency-1", name: "Currency 1" },
        },
        {
          id: "token-2",
          name: "Token 2",
          ticker: "T2",
          contractAddress: "0x456",
          parentCurrency: { id: "currency-2", name: "Currency 2" },
        },
        {
          id: "token-3",
          name: "Token 3",
          ticker: "T3",
          contractAddress: "0x789",
          parentCurrency: { id: "currency-3", name: "Currency 3" },
        },
      ],
      pagination: { nextCursor: undefined },
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("should return error when API has error", () => {
    const mockError = new Error("API Error");
    mockUseGetTokensDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: undefined,
      error: mockError,
      isSuccess: false,
      isError: true,
      status: "error",
    });

    const { result } = renderHook(() =>
      useTokensData({
        networkFamily: "ethereum",
        pageSize: 100,
        output: ["id", "name", "ticker", "contract_address"],
      }),
    );

    expect(result.current.error).toBe(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it("should provide loadNext function when there's a nextCursor", () => {
    const mockFetchNextPage = jest.fn();
    const mockPages = [
      {
        tokens: [],
        pagination: { nextCursor: "next-cursor-456" },
      },
    ];

    mockUseGetTokensDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: mockPages, pageParams: [{ cursor: "" }] },
      fetchNextPage: mockFetchNextPage,
    });

    const { result } = renderHook(() =>
      useTokensData({
        networkFamily: "ethereum",
        pageSize: 100,
        output: ["id", "name", "ticker", "contract_address"],
      }),
    );

    expect(result.current.loadNext).toBeDefined();
    result.current.loadNext?.();

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should not provide loadNext function when there's no nextCursor", () => {
    const mockPages = [
      {
        tokens: [],
        pagination: { nextCursor: undefined },
      },
    ];

    mockUseGetTokensDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: mockPages, pageParams: [{ cursor: "" }] },
    });

    const { result } = renderHook(() =>
      useTokensData({
        networkFamily: "ethereum",
        pageSize: 100,
        output: ["id", "name", "ticker", "contract_address"],
      }),
    );

    expect(result.current.loadNext).toBeUndefined();
  });

  it("should return undefined data when no pages exist", () => {
    mockUseGetTokensDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
    });

    const { result } = renderHook(() =>
      useTokensData({
        networkFamily: "ethereum",
        pageSize: 100,
        output: ["id", "name", "ticker", "contract_address"],
      }),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.loadNext).toBeUndefined();
  });
});
