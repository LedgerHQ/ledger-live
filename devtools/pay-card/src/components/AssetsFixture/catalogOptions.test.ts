import { assetSelectItems, pairFromCatalogKey } from "./catalogOptions";

describe("catalogOptions", () => {
  it("splits a catalog key into currency and network", () => {
    expect(pairFromCatalogKey("usdc.ethereum")).toEqual({
      currency: "usdc",
      network: "ethereum",
    });
  });

  it("rejects a key that is not a pair", () => {
    expect(pairFromCatalogKey("usdc")).toBeNull();
  });

  it("keeps one option per Ledger id, preferring the chain name over ticker.ticker", () => {
    const items = assetSelectItems([
      { key: "eth.eth", ledgerId: "ethereum" },
      { key: "eth.ethereum", ledgerId: "ethereum" },
      { key: "usdc.ethereum", ledgerId: "ethereum/erc20/usd__coin" },
    ]);

    expect(items).toEqual([
      { value: "eth.ethereum", label: "ETH" },
      { value: "usdc.ethereum", label: "USDC" },
    ]);
  });
});
