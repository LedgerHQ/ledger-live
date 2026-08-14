import { parseA4Asset } from "./operations";

describe("parseA4Asset", () => {
  it("returns native for 'native'", () => {
    expect(parseA4Asset("native", "0xowner")).toEqual({ type: "native" });
  });

  it("returns type only for an unknown single-segment path", () => {
    expect(parseA4Asset("foo", "0xowner")).toEqual({ type: "foo" });
  });

  it("parses EVM ERC20 2-segment path", () => {
    expect(parseA4Asset("erc20.0xcontract", "0xowner")).toEqual({
      type: "erc20",
      assetReference: "0xcontract",
      assetOwner: "0xowner",
    });
  });

  it("parses Tron TRC20 3-segment token-standard path", () => {
    expect(parseA4Asset("token.trc20.Tcontract", "Towner")).toEqual({
      type: "trc20",
      assetReference: "Tcontract",
      assetOwner: "Towner",
    });
  });

  it("parses Tron TRC10 3-segment token-standard path", () => {
    expect(parseA4Asset("token.trc10.1002000", "Towner")).toEqual({
      type: "trc10",
      assetReference: "1002000",
      assetOwner: "Towner",
    });
  });

  it("parses Stellar 2-segment token path (issuer not in path)", () => {
    expect(parseA4Asset("token.USDC", "Gowner")).toEqual({
      type: "token",
      assetReference: "USDC",
      assetOwner: "Gowner",
    });
  });
});
