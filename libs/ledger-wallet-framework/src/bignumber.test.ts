import BigNumber from "bignumber.js";
import { fromRawBigNumber, parseFiniteBigNumber } from "./bignumber";

describe("parseFiniteBigNumber", () => {
  it.each([
    ["12.5", "12.5"],
    [" 7 ", "7"],
    ["+.5", "0.5"],
    ["1e3", "1000"],
    [42, "42"],
    [10n, "10"],
    [new BigNumber(3), "3"],
  ])("parses %p", (value, expected) => {
    expect(parseFiniteBigNumber(value)?.toString()).toBe(expected);
  });

  it.each([
    undefined,
    null,
    {},
    "",
    " ",
    "abc",
    "1_000",
    "0x1f",
    "0b11",
    "0o7",
    "1e",
    "NaN",
    "Infinity",
    "-Infinity",
    Number.NaN,
    Infinity,
  ])("returns undefined for %p", value => {
    expect(parseFiniteBigNumber(value)).toBeUndefined();
  });

  it.each([
    ["0x10", "16"],
    [" 0X1F ", "31"],
    ["-0x10", "-16"],
    ["+0xff", "255"],
    ["12", "12"],
  ])("parses %p with allowHex", (value, expected) => {
    expect(parseFiniteBigNumber(value, { allowHex: true })?.toString()).toBe(expected);
  });

  it.each(["0x", "0xzz", "0b11", "0o7", "0x1_0"])("rejects %p with allowHex", value => {
    expect(parseFiniteBigNumber(value, { allowHex: true })).toBeUndefined();
  });
});

describe("fromRawBigNumber", () => {
  it.each([
    ["12.5", "12.5"],
    ["-3", "-3"],
    ["1e+21", "1e+21"],
    ["0x10", "16"],
    [42, "42"],
    [new BigNumber(3), "3"],
    ["NaN", "NaN"],
    ["Infinity", "Infinity"],
    ["-Infinity", "-Infinity"],
  ])("parses %p like new BigNumber() does", (raw, expected) => {
    expect(fromRawBigNumber(raw).toString()).toBe(expected);
    expect(fromRawBigNumber(raw).toString()).toBe(new BigNumber(raw).toString());
  });

  it.each([undefined, null, "", " ", "abc", true, {}, []])(
    "falls back to 0 for %p instead of throwing",
    raw => {
      expect(fromRawBigNumber(raw)).toEqual(new BigNumber(0));
    },
  );

  it("uses the given fallback", () => {
    expect(fromRawBigNumber(undefined, "7")).toEqual(new BigNumber(7));
  });
});
