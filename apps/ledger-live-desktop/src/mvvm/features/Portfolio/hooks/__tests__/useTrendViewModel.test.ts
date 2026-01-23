import { renderHook } from "@testing-library/react";
import { useSelector } from "LLD/hooks/redux";
import { useTrendViewModel } from "../useTrendViewModel";

jest.mock("LLD/hooks/redux");

const mockedUseSelector = jest.mocked(useSelector);

describe("useTrendViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSelector.mockReturnValue(false);
  });

  it("should format positive percentage correctly", () => {
    const { result } = renderHook(() =>
      useTrendViewModel({ valueChange: { percentage: 0.0523, value: 1000 } }),
    );

    expect(result.current).toEqual({
      percentageText: "+5.23%",
      isPositive: true,
      isAvailable: true,
    });
  });

  it("should format negative percentage correctly", () => {
    const { result } = renderHook(() =>
      useTrendViewModel({ valueChange: { percentage: -0.0312, value: -500 } }),
    );

    expect(result.current).toEqual({
      percentageText: "-3.12%",
      isPositive: false,
      isAvailable: true,
    });
  });

  it("should return isAvailable false when percentage is null", () => {
    const { result } = renderHook(() =>
      useTrendViewModel({ valueChange: { percentage: null, value: 0 } }),
    );

    expect(result.current.isAvailable).toBe(false);
  });

  it("should mask percentage in discreet mode", () => {
    mockedUseSelector.mockReturnValue(true);

    const { result } = renderHook(() =>
      useTrendViewModel({ valueChange: { percentage: 0.05, value: 1000 } }),
    );

    expect(result.current.percentageText).toBe("***");
  });
});
