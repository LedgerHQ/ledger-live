import { validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it.each(["0", "42", undefined])("returns true for valid memo %p", memo => {
    expect(validateMemo(memo)).toBe(true);
  });

  it.each(["-1", "abc"])("returns false for invalid memo %p", memo => {
    expect(validateMemo(memo)).toBe(false);
  });
});
