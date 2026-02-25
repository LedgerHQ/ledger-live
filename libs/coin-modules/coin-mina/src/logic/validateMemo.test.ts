import { MINA_MEMO_MAX_SIZE, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it.each([undefined, ""])(
    'should return true when memo is not defined (case "%s")',
    (memo?: string) => {
      const result = validateMemo(memo);
      expect(result).toBe(true);
    },
  );

  it.each(["a", "a".repeat(MINA_MEMO_MAX_SIZE), "a".repeat(MINA_MEMO_MAX_SIZE - 1)])(
    "should return true when memo is under maximum Mina memo size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );

  it.each(["a".repeat(MINA_MEMO_MAX_SIZE + 1), "a".repeat(MINA_MEMO_MAX_SIZE + 2)])(
    "should return false when memo is greater than maximum Mina memo size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(false);
    },
  );
});
