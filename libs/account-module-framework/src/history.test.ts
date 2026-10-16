import { anOperation } from "./test-utils";
import { compareNewestFirst, createMemoryHistoryStore, paginate, readHistory } from "./history";

const at = (id: string, date: string, height: number | null) =>
  anOperation({
    id,
    hash: id,
    date: new Date(date),
    block: height === null ? null : { height, hash: `h${height}`, time: new Date(date) },
  });

describe("compareNewestFirst", () => {
  it("orders by date, then pending before confirmed, then higher block, then id", () => {
    const ops = [
      at("old", "2026-01-01T00:00:00Z", 1),
      at("b", "2026-01-02T00:00:00Z", 5),
      at("a", "2026-01-02T00:00:00Z", 5),
      at("low", "2026-01-02T00:00:00Z", 4),
      at("pending", "2026-01-02T00:00:00Z", null),
    ];
    expect([...ops].sort(compareNewestFirst).map(op => op.id)).toEqual([
      "pending",
      "a",
      "b",
      "low",
      "old",
    ]);
  });
});

describe("paginate", () => {
  it("pages from an offset cursor", () => {
    expect(paginate([1, 2, 3], { limit: 2 })).toEqual({ items: [1, 2], next: "2" });
    expect(paginate([1, 2, 3], { cursor: "2", limit: 2 })).toEqual({ items: [3] });
    expect(paginate([1, 2, 3])).toEqual({ items: [1, 2, 3] });
  });

  it("rejects a cursor that is not an offset", () => {
    expect(() => paginate([1], { cursor: "x" })).toThrow("Invalid cursor x");
    expect(() => paginate([1], { cursor: "-1" })).toThrow("Invalid cursor -1");
  });
});

describe("createMemoryHistoryStore", () => {
  it("upserts by id, removes, and lists newest first", async () => {
    const store = createMemoryHistoryStore([at("a", "2026-01-01T00:00:00Z", 1)]);
    await store.upsert([at("b", "2026-01-03T00:00:00Z", 3), at("a", "2026-01-02T00:00:00Z", 2)]);
    expect(store.snapshot().map(op => [op.id, op.block?.height])).toEqual([
      ["b", 3],
      ["a", 2],
    ]);
    await store.remove(["b"]);
    expect((await store.list({ limit: 5 })).items.map(op => op.id)).toEqual(["a"]);
  });

  it("starts empty", () => {
    expect(createMemoryHistoryStore().snapshot()).toEqual([]);
  });
});

describe("readHistory", () => {
  it("walks every page, stopping on a cursor that does not advance", async () => {
    const pages = [
      { items: [at("a", "2026-01-01T00:00:00Z", 1)], next: "1" },
      { items: [at("b", "2026-01-01T00:00:00Z", 1)], next: "1" },
    ];
    const list = jest.fn(async () => pages.shift() ?? { items: [] });
    const operations = await readHistory({ list, upsert: jest.fn(), remove: jest.fn() });
    expect(operations.map(op => op.id)).toEqual(["a", "b"]);
    expect(list).toHaveBeenNthCalledWith(1, {});
    expect(list).toHaveBeenNthCalledWith(2, { cursor: "1" });
  });
});
