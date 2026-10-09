import { renderHook } from "@testing-library/react";
import { useCheckQuery } from "@domain/api-ofac";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { useOfacGeoBlockCheck } from "./useOfacGeoBlockCheck";

jest.mock("@domain/api-ofac", () => ({
  useCheckQuery: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckQuery);

describe("useOfacGeoBlockCheck", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return pending while the query is loading", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: true });

    const { result } = renderHook(() => useOfacGeoBlockCheck());

    expect(result.current).toEqual({ status: "pending" });
  });

  it("should return unavailable with geoBlocked when the check is true", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    const { result } = renderHook(() => useOfacGeoBlockCheck());

    expect(result.current).toEqual({ status: "unavailable", reason: "geoBlocked" });
  });

  it("should return available when the check is false", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    const { result } = renderHook(() => useOfacGeoBlockCheck());

    expect(result.current).toEqual({ status: "available" });
  });

  it("should return available when data is undefined after loading (fail-open)", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: false });

    const { result } = renderHook(() => useOfacGeoBlockCheck());

    expect(result.current).toEqual({ status: "available" });
  });

  it("should return available when the query errored (fail-open)", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, {
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const { result } = renderHook(() => useOfacGeoBlockCheck());

    expect(result.current).toEqual({ status: "available" });
  });

  it("should return available when a refetch errors with cached blocked data (fail-open)", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, {
      data: true,
      isLoading: false,
      isError: true,
    });

    const { result } = renderHook(() => useOfacGeoBlockCheck());

    expect(result.current).toEqual({ status: "available" });
  });
});
