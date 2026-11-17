import { renderHook } from "@testing-library/react";
import { useAnalyticsPnlPositions } from "./useAnalyticsPnlPositions";

const eth = { id: "eth" };

describe("useAnalyticsPnlPositions", () => {
  it("should resolve the scoped positions once the catalog is ready", () => {
    const { result } = renderHook(() =>
      useAnalyticsPnlPositions({ scope: { positionIds: [eth.id] }, catalogStatus: "ready" }, [eth]),
    );
    expect(result.current).toEqual({ positions: [eth], status: "ready" });
  });

  it("should report a removed position as unavailable", () => {
    const { result } = renderHook(() =>
      useAnalyticsPnlPositions({ scope: { positionIds: ["removed"] }, catalogStatus: "ready" }, [
        eth,
      ]),
    );
    expect(result.current).toEqual({ positions: undefined, status: "unavailable" });
  });

  it.each(["loading", "error"] as const)("should forward a %s catalog", catalogStatus => {
    const { result } = renderHook(() =>
      useAnalyticsPnlPositions({ scope: { positionIds: [eth.id] }, catalogStatus }, [eth]),
    );
    expect(result.current.status).toBe(catalogStatus);
  });
});
