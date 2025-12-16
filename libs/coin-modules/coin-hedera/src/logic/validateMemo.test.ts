import { HEDERA_MAX_MEMO_SIZE, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it.each([undefined, ""])(
    'should return true when memo is not defined (case "%s")',
    (memo?: string) => {
      const result = validateMemo(memo);
      expect(result).toBe(true);
    },
  );

  it.each(["a", "a".repeat(HEDERA_MAX_MEMO_SIZE), "a".repeat(HEDERA_MAX_MEMO_SIZE - 1)])(
    "should return true when memo is under maximum Hedera memo size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );

  it.each(["a".repeat(HEDERA_MAX_MEMO_SIZE + 1), "a".repeat(HEDERA_MAX_MEMO_SIZE + 2)])(
    "should return false when memo is greater than maximum Hedera memo size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(false);
    },
  );
});
