import { describe, expect, it } from "bun:test";
import { formatBaseUnits } from "./evm";
import { isTerminalIntentStatus, parseIntentId, parseStatusFilter } from "./intent-list";

describe("isTerminalIntentStatus", () => {
  it.each([
    ["success", true],
    ["failed", true],
    ["rejected", true],
    ["cancelled", true],
    ["expired", true],
    ["created", false],
    ["crafted", false],
    ["signed", false],
    ["broadcast", false],
    ["archived", null],
  ] as const)("%s is %p", (status, expected) => {
    expect(isTerminalIntentStatus(status)).toBe(expected);
  });
});

describe("parseIntentId", () => {
  it("trims and lowercases a UUID", () => {
    expect(parseIntentId(" 0192F7A4-0000-7000-8000-00000000000A ")).toBe(
      "0192f7a4-0000-7000-8000-00000000000a",
    );
  });

  it.each(["intent-123", "", "0192f7a4-0000-7000-8000", "../stats"])("rejects %p", value => {
    expect(() => parseIntentId(value)).toThrow(/is not an intent id/);
  });
});

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
