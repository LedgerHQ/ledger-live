import { assetKeyOf, assetMetadataOf, sumByAsset } from "./assets";

const native = { type: "native" };
const usdc = {
  type: "erc20",
  assetReference: "0xusdc",
  name: "USD Coin",
  unit: { name: "USDC", code: "USDC", magnitude: 6 },
};
const bitcoin = { name: "Bitcoin", ticker: "BTC", decimals: 8 };

describe("assetKeyOf", () => {
  it("names the native asset native, a token by its reference, or else by its type", () => {
    expect(assetKeyOf(native)).toBe("native");
    expect(assetKeyOf(usdc)).toBe("0xusdc");
    expect(assetKeyOf({ type: "trc10" })).toBe("trc10");
  });
});

describe("assetMetadataOf", () => {
  it("describes the native asset as the network does", () => {
    expect(assetMetadataOf(native, bitcoin)).toBe(bitcoin);
  });

  it("describes a token from its name and unit", () => {
    expect(assetMetadataOf(usdc, bitcoin)).toEqual({
      name: "USD Coin",
      ticker: "USDC",
      decimals: 6,
    });
  });

  it("falls back to the asset key for a token without name nor unit", () => {
    expect(assetMetadataOf({ type: "erc20", assetReference: "0xabc" }, bitcoin)).toEqual({
      name: "0xabc",
      ticker: "",
      decimals: 0,
    });
  });
});

describe("sumByAsset", () => {
  it("sums values and locked amounts per asset", () => {
    const sums = sumByAsset([
      { asset: native, value: 10n, locked: 2n },
      { asset: usdc, value: 5n },
      { asset: native, value: 3n },
    ]);

    expect([...sums]).toEqual([
      ["native", { asset: native, value: 13n, locked: 2n }],
      ["0xusdc", { asset: usdc, value: 5n, locked: 0n }],
    ]);
  });
});
