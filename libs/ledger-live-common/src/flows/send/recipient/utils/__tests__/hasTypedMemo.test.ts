import { hasTypedMemo } from "../hasTypedMemo";

describe("hasTypedMemo", () => {
  it("is true for a memo with a value", () => {
    expect(hasTypedMemo({ value: "12345", type: "MEMO_TEXT" })).toBe(true);
    expect(hasTypedMemo({ value: "12345" })).toBe(true);
  });

  it("is false for an empty, skipped or missing memo", () => {
    expect(hasTypedMemo({ value: "" })).toBe(false);
    expect(hasTypedMemo({ value: "", type: "NO_MEMO" })).toBe(false);
    expect(hasTypedMemo(undefined)).toBe(false);
    expect(hasTypedMemo(null)).toBe(false);
  });
});
