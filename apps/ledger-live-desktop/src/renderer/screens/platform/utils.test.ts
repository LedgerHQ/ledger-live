import { useGetManifest } from "./utils";

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: () => undefined,
}));

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

describe("useGetManifest", () => {
  describe("paraswap", () => {
    it("should fetch basic manifest", async () => {
      const manifest = useGetManifest("paraswap");
      expect(manifest.params.dappUrl).toBe(
        "https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false",
      );
    });

    it("should fetch complex manifest", async () => {
      const manifest = useGetManifest(
        "paraswap",
        {},
        "/platform/paraswap/#/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-0xdac17f958d2ee523a2206206994597c13d831ec7/0.004?network=1",
      );
      expect(manifest.params.dappUrl).toBe(
        "https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false&network=1#/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-0xdac17f958d2ee523a2206206994597c13d831ec7/0.004",
      );
    });
  });

  describe("1inch", () => {
    it("should fetch basic manifest", async () => {
      const manifest = useGetManifest("1inch");
      expect(manifest.params.dappUrl).toBe("https://app.1inch.io/?ledgerLive=true");
    });
    it("should fetch complex manifest", async () => {
      const manifest = useGetManifest(
        "1inch",
        { theme: "dark" },
        "/platform/1inch/#/1/unified/swap/eth/usdt?sourceTokenAmount=0.04",
      );
      expect(manifest.params.dappUrl).toBe(
        "https://app.1inch.io#/1/unified/swap/eth/usdt?theme=dark&ledgerLive=true&sourceTokenAmount=0.04",
      );
    });
  });
});
