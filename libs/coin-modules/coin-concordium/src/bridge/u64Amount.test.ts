import { parseU64Amount } from "./u64Amount";

describe("parseU64Amount", () => {
  it("reads a u64 amount", () => {
    expect(parseU64Amount("18446744073709551615")?.toFixed()).toBe("18446744073709551615");
  });

  it.each(["abc", "", "-1", "1.5", "18446744073709551616", "1e1000000", undefined])(
    "rejects %p",
    value => {
      expect(parseU64Amount(value)).toBeUndefined();
    },
  );
});
