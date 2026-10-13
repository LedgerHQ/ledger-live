import { renderHook } from "@testing-library/react";
import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { useAppAvailability } from "./useAppAvailability";
import { useCalCheck } from "./useCalCheck";

jest.mock("@domain/api-ofac", () => ({
  useCheckOfacGeoBlockQuery: jest.fn(),
}));

jest.mock("./useCalCheck", () => ({
  useCalCheck: jest.fn(),
}));

const CAL_URL = "https://cal.test";
const CLIENT_VERSION = "1.2.3";
const mockedUseCheckQuery = jest.mocked(useCheckOfacGeoBlockQuery);
const mockedUseCalCheck = jest.mocked(useCalCheck);

describe("useAppAvailability", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should expose the OFAC check result for splash gates", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });
    mockedUseCalCheck.mockReturnValue({ status: "available" });

    const { result } = renderHook(() => useAppAvailability(CAL_URL, CLIENT_VERSION));

    expect(result.current).toEqual({ status: "unavailable", reason: "geoBlocked" });
    expect(mockedUseCalCheck).toHaveBeenCalledWith(CAL_URL, CLIENT_VERSION);
  });

  it("should expose a CAL serviceUnavailable result", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });
    mockedUseCalCheck.mockReturnValue({
      status: "unavailable",
      reason: "serviceUnavailable",
    });

    const { result } = renderHook(() => useAppAvailability(CAL_URL, CLIENT_VERSION));

    expect(result.current).toEqual({
      status: "unavailable",
      reason: "serviceUnavailable",
    });
  });

  it("should stay pending while either check is pending", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });
    mockedUseCalCheck.mockReturnValue({ status: "pending" });

    const { result } = renderHook(() => useAppAvailability(CAL_URL, CLIENT_VERSION));

    expect(result.current).toEqual({ status: "pending" });
  });
});
