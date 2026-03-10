import { MAX_MEMO_LENGTH, validateMemo } from "../validateMemo";

describe("validateMemo", () => {
  it("should return false when memo exceeds maximum allowed size", () => {
    const memo = "a".repeat(MAX_MEMO_LENGTH + 1);
    expect(validateMemo(memo)).toBe(false);
  });

  it.each(["", "memo", "a".repeat(MAX_MEMO_LENGTH)])(
    'should return true when memo is under maximum allowed size (case: "%s...")',
    (memo: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );

  it("should measure length in bytes, not characters (multi-byte UTF-8)", () => {
    const singleMultiByteChar = "\u{1F600}";
    const charByteLength = Buffer.from(singleMultiByteChar, "utf-8").byteLength;
    expect(charByteLength).toBeGreaterThan(1);

    const count = Math.floor(MAX_MEMO_LENGTH / charByteLength);
    expect(validateMemo(singleMultiByteChar.repeat(count))).toBe(true);
    expect(validateMemo(singleMultiByteChar.repeat(count + 1))).toBe(
      (count + 1) * charByteLength <= MAX_MEMO_LENGTH,
    );
  });
});
