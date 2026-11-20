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

  // The limit is 32 UTF-8 bytes, which is what mina-signer enforces, not 32 characters
  it.each(["é".repeat(MINA_MEMO_MAX_SIZE / 2), "€".repeat(10) + "ab"])(
    "should return true when a multi-byte memo fits in the maximum byte size (case %s)",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );

  it.each(["é".repeat(MINA_MEMO_MAX_SIZE / 2 + 1), "€".repeat(11), "😀".repeat(9)])(
    "should return false when a multi-byte memo is over the maximum byte size (case %s)",
    (memo: string) => {
      expect(memo.length).toBeLessThanOrEqual(MINA_MEMO_MAX_SIZE);
      expect(validateMemo(memo)).toBe(false);
    },
  );
});
