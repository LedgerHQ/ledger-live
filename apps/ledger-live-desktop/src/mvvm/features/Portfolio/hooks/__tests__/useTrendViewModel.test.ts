import { renderHook } from "tests/testSetup";
import { useTrendViewModel } from "../useTrendViewModel";

describe("useTrendViewModel", () => {
  const initialState = {
    settings: { counterValue: "USD", locale: "en-US", discreetMode: false },
  };

  it("should format positive percentage with positive variant", () => {
    const { result } = renderHook(
      () => useTrendViewModel({ valueChange: { percentage: 0.0523, value: 1000 } }),
      { initialState },
    );

    expect(result.current).toEqual({
      percentageText: "+5.23%",
      variant: "positive",
    });
  });

  it("should format negative percentage with negative variant", () => {
    const { result } = renderHook(
      () => useTrendViewModel({ valueChange: { percentage: -0.0312, value: -500 } }),
      { initialState },
    );

    expect(result.current).toEqual({
      percentageText: "-3.12%",
      variant: "negative",
    });
  });

  it("should show 0% without sign when percentage is 0", () => {
    const { result } = renderHook(
      () => useTrendViewModel({ valueChange: { percentage: 0, value: 0 } }),
      { initialState },
    );

    expect(result.current).toEqual({
      percentageText: "0.00%",
      variant: "neutral",
    });
  });

  it("should show 0% without sign when percentage is undefined", () => {
    const { result } = renderHook(
      () => useTrendViewModel({ valueChange: { percentage: undefined, value: 0 } }),
      { initialState },
    );

    expect(result.current).toEqual({
      percentageText: "0.00%",
      variant: "neutral",
    });
  });

  it("should mask percentage text in discreet mode", () => {
    const { result } = renderHook(
      () => useTrendViewModel({ valueChange: { percentage: 0.0523, value: 1000 } }),
      {
        initialState: {
          settings: { counterValue: "USD", locale: "en-US", discreetMode: true },
        },
      },
    );

    expect(result.current).toEqual({
      percentageText: "***",
      variant: "positive",
    });
  });

  it("should keep percentage text visible in discreet mode when masking is disabled", () => {
    const { result } = renderHook(
      () =>
        useTrendViewModel({
          valueChange: { percentage: 0.0523, value: 1000 },
          useDiscreetMasking: false,
        }),
      {
        initialState: {
          settings: { counterValue: "USD", locale: "en-US", discreetMode: true },
        },
      },
    );

    expect(result.current).toEqual({
      percentageText: "+5.23%",
      variant: "positive",
    });
  });
});
