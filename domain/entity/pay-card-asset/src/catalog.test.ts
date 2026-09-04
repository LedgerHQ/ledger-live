import { payCardAssetKey } from "./assetKey";
import { PAY_CARD_ASSET_LEDGER_IDS, payCardAssetLedgerId } from "./catalog";

describe("payCardAssetKey", () => {
  it("joins the pair the provider names an asset with", () => {
    expect(payCardAssetKey("usdc", "ethereum")).toBe("usdc.ethereum");
  });

  it("lowercases both halves, because the provider has not been consistent about their case", () => {
    expect(payCardAssetKey("USDC", "Ethereum")).toBe("usdc.ethereum");
  });

  it("trims, so a padded field does not miss the catalog", () => {
    expect(payCardAssetKey(" usdc ", " ethereum ")).toBe("usdc.ethereum");
  });
});

describe("payCardAssetLedgerId", () => {
  it.each([
    ["usdt", "ethereum", "ethereum/erc20/usd_tether__erc20_"],
    ["usdc", "ethereum", "ethereum/erc20/usd__coin"],
    ["btc", "bitcoin", "bitcoin"],
    ["eth", "ethereum", "ethereum"],
    ["xrp", "ripple", "ripple"],
    ["sol", "solana", "solana"],
    ["ltc", "litecoin", "litecoin"],
  ])("maps %s on %s to its Ledger currency", (currency, network, expected) => {
    expect(payCardAssetLedgerId(currency, network)).toBe(expected);
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
    expect(payCardAssetLedgerId(currency, network)).toBe(
      payCardAssetLedgerId(
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
    expect(payCardAssetLedgerId("bxx", "ethereum")).toBeUndefined();
    expect(payCardAssetLedgerId("usdc", "polygon")).toBeUndefined();
  });

  it("never maps two provider assets onto the same wrong chain", () => {
    // Every stablecoin entry is an Ethereum token; every coin entry is its own chain.
    expect(PAY_CARD_ASSET_LEDGER_IDS["usdc.ethereum"]).not.toBe(
      PAY_CARD_ASSET_LEDGER_IDS["usdt.ethereum"],
    );
    expect(PAY_CARD_ASSET_LEDGER_IDS["eth.ethereum"]).toBe("ethereum");
  });
});
