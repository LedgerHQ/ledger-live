import { nextIndex } from "./addresses";

describe("nextIndex", () => {
  it("is the first index above the highest one used on the chain", () => {
    const addresses = [
      { address: "a", chain: 0, index: 4 },
      { address: "b", chain: 0, index: 1 },
      { address: "c", chain: 1, index: 9 },
    ];
    expect(nextIndex(addresses, 0)).toBe(5);
    expect(nextIndex(addresses, 2)).toBe(0);
  });
});
