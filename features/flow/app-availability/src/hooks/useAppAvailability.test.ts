import { renderHook } from "@testing-library/react";
import { useCheckQuery } from "@domain/api-ofac";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { useAppAvailability } from "./useAppAvailability";

jest.mock("@domain/api-ofac", () => ({
  useCheckQuery: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckQuery);

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
