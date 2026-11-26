import { MemoTooLong } from "../../../../../errors";
import { getMemoTooLongError, sanitizeMemoValue } from "../memoValue";

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

describe("getMemoTooLongError", () => {
  it("reports the length and the limit of a memo longer than maxLength", () => {
    const error = getMemoTooLongError({ value: "a".repeat(40), maxLength: 32, memoType: "text" });

    expect(error).toBeInstanceOf(MemoTooLong);
    expect(error).toMatchObject({ name: "MemoTooLong", memoLength: 40, maxLength: 32 });
  });

  it("accepts a memo exactly at maxLength", () => {
    expect(
      getMemoTooLongError({ value: "a".repeat(32), maxLength: 32, memoType: "text" }),
    ).toBeUndefined();
  });

  it("accepts any memo when the descriptor has no maxLength", () => {
    expect(getMemoTooLongError({ value: "a".repeat(1000), memoType: "text" })).toBeUndefined();
  });

  it("leaves tag memos to their memoMaxValue clamp", () => {
    expect(
      getMemoTooLongError({ value: "4294967295", maxLength: 3, memoType: "tag" }),
    ).toBeUndefined();
  });

  it("counts UTF-8 bytes, so multibyte characters under the character limit are too long", () => {
    expect(
      getMemoTooLongError({ value: "é".repeat(17), maxLength: 32, memoType: "text" }),
    ).toMatchObject({ memoLength: 34, maxLength: 32 });
  });

  it("counts a four-byte emoji as four bytes", () => {
    expect(getMemoTooLongError({ value: "👍", maxLength: 3, memoType: "text" })).toMatchObject({
      memoLength: 4,
      maxLength: 3,
    });
  });
});
