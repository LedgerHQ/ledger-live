import { CryptoAssetMetaSchema } from "./schema";

const valid = {
  id: "urn:crypto:meta-currency:ethereum",
  ticker: "ETH",
  name: "Ethereum",
  assetsIds: { ethereum: "ethereum", arbitrum: "arbitrum" },
};

describe("CryptoAssetMetaSchema", () => {
  it("validates a well-formed aggregated asset", () => {
    expect(CryptoAssetMetaSchema.parse(valid)).toEqual(valid);
  });

  it("accepts an asset present on no network", () => {
    expect(() => CryptoAssetMetaSchema.parse({ ...valid, assetsIds: {} })).not.toThrow();
  });

  it("throws when a required field is missing", () => {
    for (const key of ["id", "ticker", "name", "assetsIds"] as const) {
      const { [key]: _omitted, ...rest } = valid;
      expect(() => CryptoAssetMetaSchema.parse(rest)).toThrow();
    }
  });

  it("throws when assetsIds maps to a non-string", () => {
    expect(() => CryptoAssetMetaSchema.parse({ ...valid, assetsIds: { ethereum: 42 } })).toThrow();
  });

  /*
   * Empty strings are accepted deliberately: DADA sends them and the current transform throws on
   * an empty id rather than dropping the asset. Tightening this is LIVE-35233, not here.
   */
  it("accepts an empty id, matching current wire tolerance", () => {
    expect(() => CryptoAssetMetaSchema.parse({ ...valid, id: "" })).not.toThrow();
  });
});
