import { isValidAddress } from "./validateAddress";

describe("isValidAddress", () => {
  it("validates against the currency's rules", () => {
    expect(isValidAddress("bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs", "bitcoin")).toBe(true);
    expect(isValidAddress("bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs", "litecoin")).toBe(false);
  });

  it("refuses a currency it does not know", () => {
    expect(isValidAddress("anything", "not-a-coin")).toBe(false);
  });
});
