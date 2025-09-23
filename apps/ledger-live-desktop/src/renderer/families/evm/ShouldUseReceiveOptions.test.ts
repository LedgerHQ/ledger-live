import ShouldUseReceiveOptions from "./ShouldUseReceiveOptions";

describe("ShouldUseReceiveOptions", () => {
  it("returns true for 'ethereum'", () => {
    expect(ShouldUseReceiveOptions("ethereum")).toBe(true);
  });

  it("returns true for 'ethereum/erc20/usd__coin'", () => {
    expect(ShouldUseReceiveOptions("ethereum/erc20/usd__coin")).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(ShouldUseReceiveOptions(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(ShouldUseReceiveOptions("")).toBe(false);
  });

  it("returns false for unrelated currency id", () => {
    expect(ShouldUseReceiveOptions("bitcoin")).toBe(false);
    expect(ShouldUseReceiveOptions("ethereum/erc20/other_coin")).toBe(false);
  });
});
