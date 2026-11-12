import { toReceiveAddressData } from "../toReceiveAddressData";

const ETHEREUM = { id: "ethereum", name: "Ethereum", ticker: "ETH" };
const USDC = { id: "ethereum/erc20/usd__coin", name: "USD Coin", ticker: "USDC" };

describe("toReceiveAddressData", () => {
  it("describes a native asset on its own network", () => {
    expect(toReceiveAddressData({ asset: ETHEREUM, network: ETHEREUM, address: "0xabc" })).toEqual({
      address: "0xabc",
      asset: { name: "Ethereum", ticker: "ETH" },
      network: "Ethereum",
      assetIcon: { ledgerId: "ethereum", ticker: "ETH", network: "ethereum" },
      networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });
  });

  it("describes a token with its network for the badge", () => {
    const data = toReceiveAddressData({ asset: USDC, network: ETHEREUM, address: "0xabc" });

    expect(data.asset).toEqual({ name: "USD Coin", ticker: "USDC" });
    expect(data.network).toBe("Ethereum");
    expect(data.assetIcon).toEqual({
      ledgerId: "ethereum/erc20/usd__coin",
      ticker: "USDC",
      network: "ethereum",
    });
    expect(data.networkIcon).toEqual({ ledgerId: "ethereum", ticker: "ETH" });
  });
});
