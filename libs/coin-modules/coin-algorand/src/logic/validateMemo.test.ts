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
    "should return true when memo is under algorand maximum size",
    (memo: string) => {
      const result = validateMemo(memo);
      expect(result).toBe(true);
    },
  );

  it.each(["a".repeat(ALGORAND_MAX_MEMO_SIZE + 1), "a".repeat(ALGORAND_MAX_MEMO_SIZE + 2)])(
    "should return false when memo exceeds algorand maximum size",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(false);
    },
  );

  it("should reject when UTF-8 byte length exceeds the limit even if char count is lower", () => {
    // "é" is 2 bytes in UTF-8; 513 chars => 1026 bytes
    expect(validateMemo("é".repeat(513))).toBe(false);
  });

  it("should accept UTF-8 memo within the byte limit", () => {
    // 512 * 2 = 1024 bytes
    expect(validateMemo("é".repeat(512))).toBe(true);
  });
});
