import { chunkCurrencyIds } from "../chunkCurrencyIds";

const makeIds = (n: number, prefix = "cur") => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe("chunkCurrencyIds", () => {
  it("should return an empty array when given no IDs", () => {
    expect(chunkCurrencyIds([])).toEqual([]);
  });

  it("should return a single chunk with one ID", () => {
    expect(chunkCurrencyIds(["bitcoin"])).toEqual([["bitcoin"]]);
  });

  it("should keep 25 IDs in one chunk with default size", () => {
    const ids = makeIds(25);
    expect(chunkCurrencyIds(ids).map(c => c.length)).toEqual([25]);
  });

  it("should split 75 IDs into 3 chunks of 25", () => {
    const ids = makeIds(75);
    const chunks = chunkCurrencyIds(ids);

    expect(chunks.map(c => c.length)).toEqual([25, 25, 25]);
    expect(chunks.flat()).toEqual(ids);
  });

  it("should handle a non-divisible count (last chunk smaller)", () => {
    const ids = makeIds(30);
    const chunks = chunkCurrencyIds(ids);

    expect(chunks.map(c => c.length)).toEqual([25, 5]);
    expect(chunks.flat()).toEqual(ids);
  });

  it("should respect a custom chunk size", () => {
    const ids = makeIds(10, "id");
    const chunks = chunkCurrencyIds(ids, 3);

    expect(chunks.map(c => c.length)).toEqual([3, 3, 3, 1]);
  });

  it.each([0, -1, NaN, Infinity])("should throw RangeError for invalid size %s", size => {
    expect(() => chunkCurrencyIds(["a"], size)).toThrow(RangeError);
  });
});
