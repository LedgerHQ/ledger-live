import { sanitizeMemoValue } from "../memoValue";

describe("sanitizeMemoValue", () => {
  it("returns the value untouched for non-tag memo types", () => {
    expect(sanitizeMemoValue({ value: "abc 123", memoType: "text" })).toBe("abc 123");
    expect(sanitizeMemoValue({ value: "anything", memoType: undefined })).toBe("anything");
  });

  it("strips non-digit characters for tag memos", () => {
    expect(sanitizeMemoValue({ value: "12a3b", memoType: "tag" })).toBe("123");
    expect(sanitizeMemoValue({ value: "abc", memoType: "tag" })).toBe("");
  });

  it("clamps the numeric value to memoMaxValue", () => {
    expect(sanitizeMemoValue({ value: "5000", memoType: "tag", memoMaxValue: 4294967295 })).toBe(
      "5000",
    );
    expect(
      sanitizeMemoValue({ value: "4294967296", memoType: "tag", memoMaxValue: 4294967295 }),
    ).toBe("4294967295");
  });

  it("keeps an empty string when no digits remain", () => {
    expect(sanitizeMemoValue({ value: "", memoType: "tag", memoMaxValue: 100 })).toBe("");
  });

  it("clamps correctly with a bigint memoMaxValue (u64 upper bound)", () => {
    const U64_MAX = BigInt("18446744073709551615");
    expect(sanitizeMemoValue({ value: "0", memoType: "tag", memoMaxValue: U64_MAX })).toBe("0");
    expect(
      sanitizeMemoValue({ value: "18446744073709551615", memoType: "tag", memoMaxValue: U64_MAX }),
    ).toBe("18446744073709551615");
    expect(
      sanitizeMemoValue({ value: "18446744073709551616", memoType: "tag", memoMaxValue: U64_MAX }),
    ).toBe("18446744073709551615");
    expect(
      sanitizeMemoValue({ value: "99999999999999999999", memoType: "tag", memoMaxValue: U64_MAX }),
    ).toBe("18446744073709551615");
    // value just above Number.MAX_SAFE_INTEGER stays exact (no rounding)
    expect(
      sanitizeMemoValue({ value: "9007199254740993", memoType: "tag", memoMaxValue: U64_MAX }),
    ).toBe("9007199254740993");
  });
});
