import { getCustomDappUrl } from "./utils";

jest.mock("@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: name => {
    switch (name) {
      case "paraswap":
        return {
          id: "paraswap",
          name: "ParaSwap",
          url: "https://dapp-browser.apps.ledger.com",
          params: {
            dappUrl:
              "https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false",
          },
        };
      default:
        return {
          id: "1inch",
          name: "1inch",
          private: false,
          url: "https://dapp-browser.apps.ledger.com",
          params: {
            dappUrl: "https://app.1inch.io/?ledgerLive=true",
          },
        };
    }
  },
}));

const appId = "1inch";
const manifest = {
  id: appId,
  name: appId,
  private: false,
  url: "https://dapp-browser.apps.ledger.com",
  params: { dappUrl: "https://app.1inch.io/?ledgerLive=true" },
};

describe("getCustomDappUrl", () => {
  it("should return manifest object (ex. browser deep link)", async () => {
    const appId = "1inch";
    const customDappUrl = getCustomDappUrl(manifest, appId, { theme: "dark" });
    expect(customDappUrl).toBe(false);
  });
  it("should return manifest clone object (ex. swap deep link)", async () => {
    const customDappUrl = getCustomDappUrl(
      manifest,
      appId,
      { theme: "dark" },
      "/platform/1inch?minAmount=0.04",
    );
    expect(customDappUrl).toBe("https://app.1inch.io?theme=dark&ledgerLive=true&minAmount=0.04");
  });

  describe("paraswap", () => {
    const manifest = {
      id: "paraswap",
      name: "ParaSwap",
      url: "https://dapp-browser.apps.ledger.com",
      params: {
        dappUrl:
          "https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false",
      },
    };
    it("should fetch basic manifest", async () => {
      const customDappUrl = getCustomDappUrl(manifest);
      expect(customDappUrl).toBe(false);
    });

    it("should fetch complex manifest", async () => {
      const customDappUrl = getCustomDappUrl(
        manifest,

        "paraswap",
        {},
        "/platform/paraswap/#/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-0xdac17f958d2ee523a2206206994597c13d831ec7/0.004?network=1",
      );
      expect(customDappUrl).toBe(
        "https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false&network=1#/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-0xdac17f958d2ee523a2206206994597c13d831ec7/0.004",
      );
    });
  });

  describe("1inch", () => {
    it("should fetch basic manifest", async () => {
      const customDappUrl = getCustomDappUrl("1inch");
      expect(customDappUrl).toBe(false);
    });
    it("should fetch complex manifest", async () => {
      const customDappUrl = getCustomDappUrl(
        manifest,
        "1inch",
        { theme: "dark" },
        "/platform/1inch/#/1/unified/swap/eth/usdt?sourceTokenAmount=0.04",
      );
      expect(customDappUrl).toBe(
        "https://app.1inch.io#/1/unified/swap/eth/usdt?theme=dark&ledgerLive=true&sourceTokenAmount=0.04",
      );
    });
  });
});
