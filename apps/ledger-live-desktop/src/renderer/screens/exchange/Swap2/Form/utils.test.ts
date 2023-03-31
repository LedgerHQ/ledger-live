import { getCustomDappUrl } from "./utils";
describe("getCustomDappUrl", () => {
  it("should convert correct paraswap URL", async () => {
    const customDappUrl = getCustomDappUrl({
      provider: "paraswap",
      providerURL:
        "/platform/paraswap/#/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-0xdac17f958d2ee523a2206206994597c13d831ec7/0.004?network=1",
    });
    expect(customDappUrl).toBe(
      "https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false&network=1#/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-0xdac17f958d2ee523a2206206994597c13d831ec7/0.004",
    );
  });
  it("should convert correct 1inch URL", async () => {
    const customDappUrl = getCustomDappUrl({
      provider: "oneinch",
      providerURL: "/platform/1inch/#/1/unified/swap/eth/usdt?sourceTokenAmount=0.04",
    });
    expect(customDappUrl).toBe(
      "https://app.1inch.io/#/1/simple/swap/eth/usdt?ledgerLive=true&sourceTokenAmount=0.04",
    );
  });
  it("should not convert correct when backend send a complete url (future)", async () => {
    const customDappUrl = getCustomDappUrl({
      provider: "oneinch",
      providerURL: "https://app.1inch.io/#/test",
    });
    expect(customDappUrl).toBe("https://app.1inch.io/#/test");
  });
});
