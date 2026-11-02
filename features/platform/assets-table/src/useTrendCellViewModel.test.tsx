import React from "react";
import { renderHook } from "@testing-library/react";
import { mockAssetsTablePorts, PortsWrapper } from "./testing/mockAssetsTablePorts";
import { useTrendCellViewModel } from "./useTrendCellViewModel";

function renderTrend(trend: number | null | undefined, discreet = false) {
  const ports = mockAssetsTablePorts({ discreet });
  return renderHook(() => useTrendCellViewModel(trend), {
    wrapper: ({ children }) => <PortsWrapper ports={ports}>{children}</PortsWrapper>,
  });
}

describe("useTrendCellViewModel", () => {
  it("formats a positive percentage with a plus prefix and success color", () => {
    const { result } = renderTrend(0.023);

    expect(result.current.formattedTrend).toBe("+2.30%");
    expect(result.current.colorClass).toBe("text-success");
  });

  it("formats a negative percentage with error color", () => {
    const { result } = renderTrend(-0.015);

    expect(result.current.formattedTrend).toBe("-1.50%");
    expect(result.current.colorClass).toBe("text-error");
  });

  it("returns a dash with muted color when the percentage is null", () => {
    const { result } = renderTrend(null);

    expect(result.current.formattedTrend).toBe("-");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("returns a dash with muted color when the percentage is undefined", () => {
    const { result } = renderTrend(undefined);

    expect(result.current.formattedTrend).toBe("-");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("returns 0.00% with muted color for zero", () => {
    const { result } = renderTrend(0);

    expect(result.current.formattedTrend).toBe("0.00%");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("masks the percentage when discreet mode is enabled", () => {
    const { result } = renderTrend(1, true);

    expect(result.current.formattedTrend).toBe("***");
    expect(result.current.colorClass).toBe("text-success");
  });
});
