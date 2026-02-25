import { STACKS_MAX_MEMO_SIZE, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it("should return false when memo exceed maximum allowed size", () => {
    const memo = "a".repeat(STACKS_MAX_MEMO_SIZE + 1);
    const result = validateMemo(memo);
    expect(result).toEqual(false);
  });

  it.each(["", "memo", "a".repeat(STACKS_MAX_MEMO_SIZE), "a".repeat(STACKS_MAX_MEMO_SIZE - 1)])(
    "should return true when memo is under maximum allowed size",
    (memo: string) => {
      const result = validateMemo(memo);
      expect(result).toEqual(true);
    },
  );
});
