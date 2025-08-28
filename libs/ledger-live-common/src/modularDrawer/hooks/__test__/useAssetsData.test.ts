/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useAssetsData } from "../useAssetsData";
import { useGetAssetsDataQuery } from "../../data/state-manager/api";

jest.mock("../../data/state-manager/api", () => ({
  useGetAssetsDataQuery: jest.fn(),
}));

const mockSetCursor = jest.fn();
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: jest.fn(() => [undefined, mockSetCursor]),
  useCallback: jest.fn(fn => fn),
  useMemo: jest.fn(fn => fn()),
}));

const mockUseGetAssetsDataQuery = jest.mocked(useGetAssetsDataQuery);

describe("useAssetsData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state when API is loading", () => {
    mockUseGetAssetsDataQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      refetch: jest.fn(),
      isFetching: false,
      isSuccess: false,
      isError: false,
      currentData: undefined,
    });

    const { result } = renderHook(() => useAssetsData({}));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBe(undefined);
    expect(result.current.hasMore).toBe(false);
  });

  it("should return data and hasMore when API returns data", () => {
    const mockData = {
      assetsData: [],
      pagination: { nextCursor: "test-cursor" },
    };
    mockUseGetAssetsDataQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
      isFetching: false,
      isSuccess: true,
      isError: false,
      currentData: mockData,
    });

    const { result } = renderHook(() => useAssetsData({}));

    expect(result.current.data).toBe(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it("should return error when API has error", () => {
    const mockError = new Error("API Error");
    mockUseGetAssetsDataQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
      isFetching: false,
      isSuccess: false,
      isError: true,
      currentData: undefined,
    });

    const { result } = renderHook(() => useAssetsData({}));

    expect(result.current.error).toBe(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it("should call setCursor when loadNext is called and there's a nextCursor", () => {
    const nextCursor = "next-cursor-456";
    mockUseGetAssetsDataQuery.mockReturnValue({
      data: {
        assetsData: [],
        pagination: { nextCursor },
      },
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
      isFetching: false,
      isSuccess: true,
      isError: false,
      currentData: {
        assetsData: [],
        pagination: { nextCursor },
      },
    });

    const { result } = renderHook(() => useAssetsData({}));

    result.current.loadNext();

    expect(mockSetCursor).toHaveBeenCalledWith(nextCursor);
  });

  it("should not call setCursor when there's no nextCursor", () => {
    mockUseGetAssetsDataQuery.mockReturnValue({
      data: {
        assetsData: [],
        pagination: { nextCursor: undefined },
      },
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
      isFetching: false,
      isSuccess: true,
      isError: false,
      currentData: {
        assetsData: [],
        pagination: { nextCursor: undefined },
      },
    });

    const { result } = renderHook(() => useAssetsData({}));

    result.current.loadNext();

    expect(mockSetCursor).not.toHaveBeenCalled();
  });
});
