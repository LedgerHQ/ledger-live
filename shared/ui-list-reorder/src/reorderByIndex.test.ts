import { reorderByIndex } from "./reorderByIndex";

describe("reorderByIndex", () => {
  it("moves an item without mutating the input", () => {
    const items = ["one", "two", "three"];

    expect(reorderByIndex(items, 0, 2)).toEqual(["two", "three", "one"]);
    expect(items).toEqual(["one", "two", "three"]);
  });

  it("returns a copy when an index is invalid", () => {
    const items = ["one", "two"];

    expect(reorderByIndex(items, -1, 1)).toEqual(items);
    expect(reorderByIndex(items, 0, 4)).toEqual(items);
    expect(reorderByIndex(items, 0, 0)).not.toBe(items);
  });
});
