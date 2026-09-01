import { splitAddress } from "../splitAddress";

describe("splitAddress", () => {
  it("splits first and last 8 characters for highlighting", () => {
    expect(splitAddress("0xe4912d2d1234567890abcdef40517672")).toEqual({
      start: "0xe4912d",
      middle: "2d1234567890abcdef",
      end: "40517672",
    });
  });

  it("respects a custom edge", () => {
    expect(splitAddress("0x1234567890abcdef", 4)).toEqual({
      start: "0x12",
      middle: "34567890ab",
      end: "cdef",
    });
  });

  it("returns the full address as start when too short to split", () => {
    expect(splitAddress("0x1234")).toEqual({ start: "0x1234", middle: "", end: "" });
    expect(splitAddress("abcdefghijklmnop", 8)).toEqual({
      start: "abcdefghijklmnop",
      middle: "",
      end: "",
    });
  });

  it("returns the full address as start when edge is non-positive", () => {
    expect(splitAddress("0x1234567890abcdef", 0)).toEqual({
      start: "0x1234567890abcdef",
      middle: "",
      end: "",
    });
  });
});
