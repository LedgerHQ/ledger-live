import { isUnsupportedPair } from "./unsupportedPairs";

describe("isUnsupportedPair", () => {
  it("blocks near -> stellar", () => {
    expect(isUnsupportedPair("near", "stellar")).toBe(true);
  });

  it("blocks stellar -> near (direction-agnostic)", () => {
    expect(isUnsupportedPair("stellar", "near")).toBe(true);
  });

  it("does not block unrelated pairs", () => {
    expect(isUnsupportedPair("ethereum", "bitcoin")).toBe(false);
  });

  it("does not block pairs that only share one side with a blocked entry", () => {
    expect(isUnsupportedPair("near", "bitcoin")).toBe(false);
    expect(isUnsupportedPair("ethereum", "stellar")).toBe(false);
  });

  it("is case-sensitive: exact lowercase currency ids are required", () => {
    // Chain currency ids are lowercase by convention (`ethereum`, `bitcoin`,
    // `near`, `stellar`). Upstream callers must not pass display names or
    // upper-cased tickers; guarding against that is out of scope here.
    expect(isUnsupportedPair("NEAR", "stellar")).toBe(false);
    expect(isUnsupportedPair("near", "STELLAR")).toBe(false);
  });
});
