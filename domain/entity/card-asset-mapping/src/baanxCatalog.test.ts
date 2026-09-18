import { assetMappingKey } from "./assetKey";
import { BAANX_ASSET_LEDGER_IDS, baanxAssetLedgerId, isBaanxAssetCurrency } from "./baanxCatalog";

describe("assetMappingKey", () => {
  it("joins the pair the provider names an asset with", () => {
    expect(assetMappingKey("usdc", "ethereum")).toBe("usdc.ethereum");
  });

  it("lowercases both halves, because the provider has not been consistent about their case", () => {
    expect(assetMappingKey("USDC", "Ethereum")).toBe("usdc.ethereum");
  });

  it("trims, so a padded field does not miss the catalog", () => {
    expect(assetMappingKey(" usdc ", " ethereum ")).toBe("usdc.ethereum");
  });
});

describe("baanxAssetLedgerId", () => {
  it.each([
    ["usdt", "ethereum", "ethereum/erc20/usd_tether__erc20_"],
    ["usdc", "ethereum", "ethereum/erc20/usd__coin"],
    ["btc", "bitcoin", "bitcoin"],
    ["eth", "ethereum", "ethereum"],
    ["xrp", "ripple", "ripple"],
    ["sol", "solana", "solana"],
    ["ltc", "litecoin", "litecoin"],
  ])("maps %s on %s to its Ledger currency", (currency, network, expected) => {
    expect(baanxAssetLedgerId(currency, network)).toBe(expected);
  });

  it.each([
    ["usdt", "usdt"],
    ["usdc", "usdc"],
    ["btc", "btc"],
    ["eth", "eth"],
    ["xrp", "xrp"],
    ["sol", "sol"],
    ["ltc", "ltc"],
  ])("also reads %s answered with the ticker as its network", (currency, network) => {
    expect(baanxAssetLedgerId(currency, network)).toBe(
      baanxAssetLedgerId(
        currency,
        {
          usdt: "ethereum",
          usdc: "ethereum",
          btc: "bitcoin",
          eth: "ethereum",
          xrp: "ripple",
          sol: "solana",
          ltc: "litecoin",
        }[currency]!,
      ),
    );
  });

  it("does not guess a currency for a pair it does not cover", () => {
    expect(baanxAssetLedgerId("bxx", "ethereum")).toBeUndefined();
    expect(baanxAssetLedgerId("usdc", "polygon")).toBeUndefined();
  });

  it("never maps two provider assets onto the same wrong chain", () => {
    // Every stablecoin entry is an Ethereum token; every coin entry is its own chain.
    expect(BAANX_ASSET_LEDGER_IDS["usdc.ethereum"]).not.toBe(
      BAANX_ASSET_LEDGER_IDS["usdt.ethereum"],
    );
    expect(BAANX_ASSET_LEDGER_IDS["eth.ethereum"]).toBe("ethereum");
  });
});

describe("isBaanxAssetCurrency", () => {
  it("reads the provider asset codes back from a Ledger id", () => {
    expect(isBaanxAssetCurrency("ethereum/erc20/usd__coin", "USDC")).toBe(true);
    expect(isBaanxAssetCurrency("ethereum", "eth")).toBe(true);
    expect(isBaanxAssetCurrency("bitcoin", " BTC ")).toBe(true);
  });

  it("keeps a token apart from the chain it lives on", () => {
    expect(isBaanxAssetCurrency("ethereum", "usdc")).toBe(false);
    expect(isBaanxAssetCurrency("ethereum/erc20/usd__coin", "usdt")).toBe(false);
  });

  it("matches nothing for a Ledger id the catalog does not resolve to", () => {
    expect(isBaanxAssetCurrency("polygon", "usdc")).toBe(false);
  });
});
