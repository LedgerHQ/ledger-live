import { resolveNearestPointTooltip } from "../utils/resolveNearestPointTooltip";
import type { LineChartPointTooltip } from "../types";

const tooltip = (label: string): LineChartPointTooltip => ({
  rows: [{ label, value: "$1" }],
});

describe("resolveNearestPointTooltip", () => {
  it("returns undefined when there are no markers", () => {
    expect(resolveNearestPointTooltip(new Map(), 5, 100)).toBeUndefined();
  });

  it("resolves an exact index match", () => {
    const map = new Map([[10, tooltip("a")]]);
    expect(resolveNearestPointTooltip(map, 10, 100)?.rows[0].label).toBe("a");
  });

  it("resolves a marker that is off by one (default tolerance for sparse data)", () => {
    const map = new Map([[10, tooltip("a")]]);
    expect(resolveNearestPointTooltip(map, 11, 50)?.rows[0].label).toBe("a");
  });

  it("returns undefined when the nearest marker is beyond the tolerance", () => {
    const map = new Map([[10, tooltip("a")]]);
    expect(resolveNearestPointTooltip(map, 20, 50)).toBeUndefined();
  });

  it("widens the tolerance for dense ranges", () => {
    const map = new Map([[1000, tooltip("a")]]);
    // 2000 points -> tolerance 20, so an index 15 away still resolves.
    expect(resolveNearestPointTooltip(map, 1015, 2000)?.rows[0].label).toBe("a");
  });

  it("picks the closest marker when several are present", () => {
    const map = new Map([
      [10, tooltip("a")],
      [40, tooltip("b")],
    ]);
    expect(resolveNearestPointTooltip(map, 39, 100)?.rows[0].label).toBe("b");
  });
});
