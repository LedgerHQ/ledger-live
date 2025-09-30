import shouldUseReceiveOptions from "./shouldUseReceiveOptions";

describe("shouldUseReceiveOptions", () => {
  it("returns true for 'ethereum/erc20/usd__coin'", () => {
    expect(shouldUseReceiveOptions("ethereum/erc20/usd__coin")).toBe(true);
  });

  it("returns true for 'ethereum'", () => {
    expect(shouldUseReceiveOptions("ethereum")).toBe(true);
  });

  it("returns false for undefined", () => {
    expect(shouldUseReceiveOptions(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(shouldUseReceiveOptions("")).toBe(false);
  });

  it("returns false for other currency ids", () => {
    expect(shouldUseReceiveOptions("bitcoin")).toBe(false);
    expect(shouldUseReceiveOptions("ethereum/erc20/other_token")).toBe(false);
    expect(shouldUseReceiveOptions("usd__coin")).toBe(false);
  });
});
