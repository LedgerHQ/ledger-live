import { normalizeEarnUiVersionOrNull } from "./earnUiVersion";

describe("normalizeEarnUiVersionOrNull", () => {
  it.each([
    ["v1", "v1"],
    ["v2", "v2"],
    ["1", "v1"],
    ["2", "v2"],
    [1, "v1"],
    [2, "v2"],
    ["01", "v1"],
    ["v01", "v1"],
  ])("normalizes valid value %p => %s", (raw, expected) => {
    expect(normalizeEarnUiVersionOrNull(raw)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    ["v0"],
    ["0"],
    [0],
    [-1],
    [1.5],
    ["v1.5"],
    ["garbage"],
  ])("returns null for invalid value %p", raw => {
    expect(normalizeEarnUiVersionOrNull(raw)).toBeNull();
  });
});
