import { deepMergeCryptoAssets } from "../deepMergeCryptoAssets";
import type { CryptoAssetMeta } from "../../entities";

type MetaMap = Record<string, CryptoAssetMeta>;

const makeMeta = (id: string, assetsIds: Record<string, string>): CryptoAssetMeta => ({
  id,
  ticker: id.toUpperCase(),
  name: id,
  assetsIds,
});

describe("deepMergeCryptoAssets", () => {
  it("should add new meta-currencies from source", () => {
    const target: MetaMap = {};
    deepMergeCryptoAssets(target, { eth: makeMeta("eth", { ethereum: "ethereum" }) });

    expect(target.eth.assetsIds).toEqual({ ethereum: "ethereum" });
  });

  it("should merge assetsIds when same meta-currency exists in both", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum" }) };
    deepMergeCryptoAssets(target, { eth: makeMeta("eth", { arbitrum: "arbitrum", base: "base" }) });

    expect(target.eth.assetsIds).toEqual({
      ethereum: "ethereum",
      arbitrum: "arbitrum",
      base: "base",
    });
  });

  it("should overwrite assetsIds entries from source", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum-v1" }) };
    deepMergeCryptoAssets(target, {
      eth: makeMeta("eth", { ethereum: "ethereum-v2", optimism: "optimism" }),
    });

    expect(target.eth.assetsIds.ethereum).toBe("ethereum-v2");
    expect(target.eth.assetsIds.optimism).toBe("optimism");
  });

  it("should handle both new and existing meta-currencies in one call", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum" }) };
    deepMergeCryptoAssets(target, {
      eth: makeMeta("eth", { arbitrum: "arbitrum" }),
      btc: makeMeta("btc", { bitcoin: "bitcoin" }),
    });

    expect(Object.keys(target)).toEqual(["eth", "btc"]);
    expect(target.eth.assetsIds).toEqual({ ethereum: "ethereum", arbitrum: "arbitrum" });
    expect(target.btc.assetsIds).toEqual({ bitcoin: "bitcoin" });
  });

  it("should be a no-op for empty source", () => {
    const target: MetaMap = { eth: makeMeta("eth", { ethereum: "ethereum" }) };
    deepMergeCryptoAssets(target, {});

    expect(target.eth.assetsIds).toEqual({ ethereum: "ethereum" });
  });

  it("should populate empty target from source", () => {
    const target: MetaMap = {};
    const source = { btc: makeMeta("btc", { bitcoin: "bitcoin" }) };
    deepMergeCryptoAssets(target, source);

    expect(target.btc).toEqual(source.btc);
  });
});
