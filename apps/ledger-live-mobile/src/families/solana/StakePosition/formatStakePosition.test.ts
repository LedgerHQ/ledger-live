import { formatApy, shortAddress } from "./formatStakePosition";

describe("shortAddress", () => {
  it("should keep six characters at each end of a long address", () => {
    expect(shortAddress("FigmentVote1111111111111111111111111111111")).toBe("Figmen…111111");
  });

  it("should keep an address short enough to show whole", () => {
    expect(shortAddress("1234567890123")).toBe("1234567890123");
  });

  it("should keep an empty address empty", () => {
    expect(shortAddress("")).toBe("");
  });
});

describe("formatApy", () => {
  it("should show a fraction as a percentage with two decimals at most", () => {
    expect(formatApy(0.078107, "en")).toBe("7.81%");
  });

  it("should show a zero APY", () => {
    expect(formatApy(0, "en")).toBe("0%");
  });

  it("should follow the locale", () => {
    expect(formatApy(0.078107, "fr")).toBe("7,81\u00a0%");
  });
});
