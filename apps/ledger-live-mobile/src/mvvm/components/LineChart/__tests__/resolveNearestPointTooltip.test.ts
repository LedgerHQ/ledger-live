import { resolveNearestPointTooltip } from "../utils/resolveNearestPointTooltip";
import type { LineChartPointTooltip } from "../types";

const tooltip = (label: string): LineChartPointTooltip => ({ rows: [{ label, value: "1" }] });
const a = tooltip("a");
const b = tooltip("b");

type Case = [
  string,
  ReadonlyMap<number, LineChartPointTooltip>,
  number,
  number,
  LineChartPointTooltip | undefined,
];

describe("resolveNearestPointTooltip", () => {
  it.each<Case>([
    ["no point tooltips → undefined", new Map(), 5, 100, undefined],
    ["exact index match", new Map([[10, a]]), 10, 1000, a],
    // length 1000 → tolerance round(1000 / 100) = 10
    ["nearest within tolerance", new Map([[100, a]]), 108, 1000, a],
    ["nearest beyond tolerance → undefined", new Map([[100, a]]), 120, 1000, undefined],
    [
      "closest among several candidates",
      new Map([
        [100, a],
        [140, b],
      ]),
      138,
      1000,
      b,
    ],
    // short series → minimum tolerance of 1
    ["short series, within min tolerance", new Map([[5, a]]), 6, 10, a],
    ["short series, beyond min tolerance → undefined", new Map([[5, a]]), 7, 10, undefined],
  ])("%s", (_label, map, index, length, expected) => {
    expect(resolveNearestPointTooltip(map, index, length)).toEqual(expected);
  });
});
