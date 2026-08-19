import { getInsertedCharacterCount } from "./getInsertedCharacterCount";

describe("getInsertedCharacterCount", () => {
  it("should return zero when the value is unchanged", () => {
    expect(getInsertedCharacterCount("0x1234", "0x1234")).toBe(0);
  });

  it("should return one for a single-character edit", () => {
    expect(getInsertedCharacterCount("0x123", "0x1234")).toBe(1);
  });

  it("should return the pasted segment length for multi-character inserts", () => {
    expect(getInsertedCharacterCount("0x1234", "0x1234567890")).toBe(6);
    expect(getInsertedCharacterCount("0x1234", "0x12pasted567890")).toBe(12);
  });
});
