import { MAX_MEMO_LENGTH, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it("should return false when memo exceed maximum allowed size", () => {
    const memo = "a".repeat(MAX_MEMO_LENGTH + 1);
    expect(validateMemo(memo)).toBe(false);
  });

  it.each(["", "memo", "a".repeat(MAX_MEMO_LENGTH)])(
    "should return true when memo is under maximum allowed size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );
});
