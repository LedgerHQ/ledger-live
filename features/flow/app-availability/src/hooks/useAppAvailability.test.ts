import { renderHook } from "@testing-library/react";
import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { useAppAvailability } from "./useAppAvailability";

jest.mock("@domain/api-ofac", () => ({
  useCheckOfacGeoBlockQuery: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckOfacGeoBlockQuery);

describe("useAppAvailability", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should expose the OFAC check result for splash gates", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    const { result } = renderHook(() => useAppAvailability());

    expect(result.current).toEqual({ status: "unavailable", reason: "geoBlocked" });
  });
});
