import { describe, expect, it } from "bun:test";
import { formatBaseUnits } from "./evm";
import { parseStatusFilter } from "./intent-list";

describe("parseStatusFilter", () => {
  it("returns undefined when no filter is given", () => {
    expect(parseStatusFilter(undefined)).toBeUndefined();
  });

  it("trims, de-duplicates and keeps known states", () => {
    expect(parseStatusFilter(" signed,broadcast , signed ")).toEqual(["signed", "broadcast"]);
  });

  it.each(["pending", "signed,PENDING", ",", ""])("rejects %p", value => {
    expect(() => parseStatusFilter(value)).toThrow(/--status/);
  });
});

describe("formatBaseUnits", () => {
  it.each([
    ["10000000000000000", 18, "0.01"],
    ["1000000000000000000000001", 18, "1000000.000000000000000001"],
    ["2500000", 6, "2.5"],
    ["7", 6, "0.000007"],
    ["0", 18, "0"],
  ])("formats %s with %d decimals as %s", (amount, decimals, expected) => {
    expect(formatBaseUnits(amount, decimals)).toBe(expected);
  });
});
