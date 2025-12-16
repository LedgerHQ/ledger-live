import { ALGORAND_MAX_MEMO_SIZE, validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it.each([undefined, ""])(
    'should return true when memo is not defined (case "%s")',
    (memo?: string) => {
      const result = validateMemo(memo);
      expect(result).toBe(true);
    },
  );

  it.each(["a", "a".repeat(ALGORAND_MAX_MEMO_SIZE), "a".repeat(ALGORAND_MAX_MEMO_SIZE - 1)])(
    "should return true when memo is less than algorand maximum size",
    (memo: string) => {
      const result = validateMemo(memo);
      expect(result).toBe(true);
    },
  );
});
