import { CARDANO_MAX_MEMO_TAG_SIZE, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it.each([undefined, ""])(
    'should return true when memo is not defined (case "%s")',
    (memo?: string) => {
      const result = validateMemo(memo);
      expect(result).toBe(true);
    },
  );

  it.each(["a", "a".repeat(CARDANO_MAX_MEMO_TAG_SIZE), "a".repeat(CARDANO_MAX_MEMO_TAG_SIZE - 1)])(
    "should return true when memo is under maximum Cardano memo size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );

  it.each(["a".repeat(CARDANO_MAX_MEMO_TAG_SIZE + 1), "a".repeat(CARDANO_MAX_MEMO_TAG_SIZE + 2)])(
    "should return false when memo is greater than maximum Cardano memo size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(false);
    },
  );
});
