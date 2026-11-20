import { toReceiveAddressData } from "../toReceiveAddressData";

const ethereum = { id: "ethereum", name: "Ethereum", ticker: "ETH" };
const usdc = {
  id: "ethereum/erc20/usd__coin_0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  name: "USD Coin",
  ticker: "USDC",
};

describe("toReceiveAddressData", () => {
  it("should show a native coin on its own network", () => {
    expect(toReceiveAddressData({ asset: ethereum, network: ethereum })).toEqual({
      asset: { name: "Ethereum", ticker: "ETH" },
      network: "Ethereum",
      assetIcon: { ledgerId: "ethereum", ticker: "ETH", network: "ethereum" },
      networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });
  });

  it("should show a token with its network's icon", () => {
    expect(toReceiveAddressData({ asset: usdc, network: ethereum })).toEqual({
      asset: { name: "USD Coin", ticker: "USDC" },
      network: "Ethereum",
      assetIcon: { ledgerId: usdc.id, ticker: "USDC", network: "ethereum" },
      networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
    });
  });
});
