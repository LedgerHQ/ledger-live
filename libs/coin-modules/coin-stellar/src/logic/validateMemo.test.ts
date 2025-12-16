import { MEMO_HASH_FIXED_SIZE, MEMO_TEXT_MAXIMUM_SIZE, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it("should return false when type is NO_MEMO but memo is present", () => {
    const memo = "memo";
    expect(validateMemo(memo, "NO_MEMO")).toEqual(false);
  });

  it("should return true when type is NO_MEMO and memo is empty", () => {
    expect(validateMemo("", "NO_MEMO")).toEqual(true);
  });

  it.each(["a".repeat(MEMO_TEXT_MAXIMUM_SIZE + 1), "a".repeat(MEMO_TEXT_MAXIMUM_SIZE + 2)])(
    "should return false when type is MEMO_TEXT but memo exceed maximum allowed size",
    (memo: string) => {
      expect(validateMemo(memo, "MEMO_TEXT")).toEqual(false);
    },
  );

  it.each(["memo", "a".repeat(MEMO_TEXT_MAXIMUM_SIZE), "a".repeat(MEMO_TEXT_MAXIMUM_SIZE - 1)])(
    "should return true when type is MEMO_TEXT and memo is under maximum allowed size",
    (memo: string) => {
      expect(validateMemo(memo, "MEMO_TEXT")).toEqual(true);
    },
  );

  it("should return false when type is MEMO_ID and memo is NaN", () => {
    expect(validateMemo(Number.NaN.toString(), "MEMO_ID")).toEqual(false);
  });

  it.each(["0", "1", "-1", "123.456"])(
    "should return true when type is MEMO_ID and memo is a number",
    (memo: string) => {
      expect(validateMemo(memo, "MEMO_ID")).toEqual(true);
    },
  );

  it.each(["", "a", "a".repeat(MEMO_HASH_FIXED_SIZE + 1), "a".repeat(MEMO_HASH_FIXED_SIZE - 1)])(
    "should return false when type is MEMO_HASH and memo has the wrong size",
    (memo: string) => {
      expect(validateMemo(memo, "MEMO_HASH")).toEqual(false);
    },
  );

  it("should return true when type is MEMO_HASH and memo has the wrong size", () => {
    const memo = "a".repeat(MEMO_HASH_FIXED_SIZE);
    expect(validateMemo(memo, "MEMO_HASH")).toEqual(true);
  });

  it.each(["", "a", "a".repeat(MEMO_HASH_FIXED_SIZE + 1), "a".repeat(MEMO_HASH_FIXED_SIZE - 1)])(
    "should return false when type is MEMO_RETURN and memo has the wrong size",
    (memo: string) => {
      expect(validateMemo(memo, "MEMO_RETURN")).toEqual(false);
    },
  );

  it("should return true when type is MEMO_RETURN and memo has the wrong size", () => {
    const memo = "a".repeat(MEMO_HASH_FIXED_SIZE);
    expect(validateMemo(memo, "MEMO_RETURN")).toEqual(true);
  });
});
