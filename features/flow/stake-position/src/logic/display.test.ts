import { initialOf, middleEllipsis } from "./display";

describe("middleEllipsis", () => {
  it("should keep the first and the last six characters of a long address", () => {
    expect(middleEllipsis(`AAAAAA${"b".repeat(32)}CCCCCC`)).toBe("AAAAAA…CCCCCC");
  });

  it("should keep an address that is no longer than its ellipsized form", () => {
    expect(middleEllipsis("1234567890123")).toBe("1234567890123");
  });
});

describe("initialOf", () => {
  it("should give the capital initial of a name", () => {
    expect(initialOf("  ledger by figment")).toBe("L");
  });

  it("should give nothing for an empty name", () => {
    expect(initialOf("")).toBe("");
  });
});
