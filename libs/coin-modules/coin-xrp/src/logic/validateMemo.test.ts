import { validateMemo, UINT32_MAX } from "./validateMemo";

describe("validateMemo", () => {
  it.each([undefined, ""])(
    'should return true when memo is not defined (case "%s")',
    (memo?: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );

  it.each([
    "0",
    UINT32_MAX.toString(),
    UINT32_MAX.minus(1).toString(),
    UINT32_MAX.minus(2).toString(),
  ])(
    "should return true when memo is only numeric and less or equal than UINT32_MAX",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(true);
    },
  );

  it.each(["a", "&", "a&"])("should return false when memo is not numeric", (memo: string) => {
    expect(validateMemo(memo)).toBe(false);
  });

  it("should return false when memo is NaN", () => {
    expect(validateMemo(Number.NaN.toString())).toBe(false);
  });

  it("should return false when memo is only numeric and not finite (decimal)", () => {
    expect(validateMemo((123.456).toString())).toBe(false);
  });

  it("should return false when memo is only numeric and negative", () => {
    expect(validateMemo((-1).toString())).toBe(false);
  });

  it.each([UINT32_MAX.plus(1).toString(), UINT32_MAX.plus(2).toString()])(
    "should return false when memo is only numeric and greater than UINT32_MAX",
    (memo: string) => {
      expect(validateMemo(memo)).toBe(false);
    },
  );
});
