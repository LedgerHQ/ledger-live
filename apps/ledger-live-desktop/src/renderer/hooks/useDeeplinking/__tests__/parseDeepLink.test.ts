import { parseDeepLink, createRoute } from "../parseDeepLink";

describe("parseDeepLink", () => {
  describe("parseDeepLink function", () => {
    it("parses basic deeplink URL", () => {
      const result = parseDeepLink("ledgerwallet://accounts");
      
      expect(result.url).toBe("accounts");
      expect(result.path).toBe("");
      expect(result.query).toEqual({});
      expect(result.search).toBe("");
    });

    it("parses deeplink with path", () => {
      const result = parseDeepLink("ledgerwallet://settings/about");
      
      expect(result.url).toBe("settings");
      expect(result.path).toBe("about");
    });

    it("parses deeplink with query parameters", () => {
      const result = parseDeepLink("ledgerwallet://send?currency=btc&amount=1.5");
      
      expect(result.url).toBe("send");
      expect(result.query).toEqual({
        currency: "btc",
        amount: "1.5",
      });
    });

    it("parses deeplink with both path and query", () => {
      const result = parseDeepLink("ledgerwallet://earn/deposit?cryptoAssetId=eth&accountId=123");
      
      expect(result.url).toBe("earn");
      expect(result.path).toBe("deposit");
      expect(result.query).toEqual({
        cryptoAssetId: "eth",
        accountId: "123",
      });
    });

    it("preserves search string", () => {
      const result = parseDeepLink("ledgerwallet://buy?currency=btc&ref=campaign");
      
      expect(result.search).toBe("?currency=btc&ref=campaign");
    });

    it("extracts tracking data", () => {
      const result = parseDeepLink(
        "ledgerwallet://send?ajs_prop_source=email&ajs_prop_campaign=promo&currency=eth",
      );
      
      expect(result.tracking).toEqual({
        ajsPropSource: "email",
        ajsPropCampaign: "promo",
        ajsPropTrackData: undefined,
        currency: "eth",
        installApp: undefined,
        appName: undefined,
        deeplinkSource: undefined,
        deeplinkType: undefined,
        deeplinkDestination: undefined,
        deeplinkChannel: undefined,
        deeplinkMedium: undefined,
        deeplinkCampaign: undefined,
        deeplinkLocation: undefined,
        url: "send",
      });
    });

    it("strips leading and trailing slashes from path", () => {
      const result = parseDeepLink("ledgerwallet://discover//paraswap/");
      
      expect(result.path).toBe("paraswap");
    });
  });

  describe("createRoute function", () => {
    it("creates accounts route", () => {
      const parsed = parseDeepLink("ledgerwallet://accounts?address=bc1q123");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "accounts",
        address: "bc1q123",
      });
    });

    it("creates account route", () => {
      const parsed = parseDeepLink("ledgerwallet://account?currency=btc&address=bc1q456");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "account",
        currency: "btc",
        address: "bc1q456",
      });
    });

    it("creates add-account route", () => {
      const parsed = parseDeepLink("ledgerwallet://add-account?currency=ethereum");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "add-account",
        currency: "ethereum",
      });
    });

    it("creates buy route", () => {
      const parsed = parseDeepLink("ledgerwallet://buy?currency=btc");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "buy",
        search: "?currency=btc",
      });
    });

    it("creates earn route", () => {
      const parsed = parseDeepLink("ledgerwallet://earn/deposit?cryptoAssetId=eth");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "earn",
        path: "deposit",
        cryptoAssetId: "eth",
        accountId: undefined,
        search: "?cryptoAssetId=eth",
      });
    });

    it("creates myledger route", () => {
      const parsed = parseDeepLink("ledgerwallet://myledger?installApp=bitcoin");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "myledger",
        installApp: "bitcoin",
      });
    });

    it("creates swap route", () => {
      const parsed = parseDeepLink("ledgerwallet://swap?fromToken=btc&toToken=eth&amountFrom=1");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "swap",
        amountFrom: "1",
        fromToken: "btc",
        toToken: "eth",
        affiliate: undefined,
      });
    });

    it("creates bridge route", () => {
      const parsed = parseDeepLink("ledgerwallet://bridge?origin=https://example.com&appName=Test");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "bridge",
        origin: "https://example.com",
        appName: "Test",
      });
    });

    it("creates send route", () => {
      const parsed = parseDeepLink("ledgerwallet://send?currency=eth&recipient=0x123&amount=1.5");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "send",
        currency: "eth",
        recipient: "0x123",
        amount: "1.5",
      });
    });

    it("creates receive route", () => {
      const parsed = parseDeepLink("ledgerwallet://receive?currency=btc");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "receive",
        currency: "btc",
        recipient: undefined,
        amount: undefined,
      });
    });

    it("creates delegate route", () => {
      const parsed = parseDeepLink("ledgerwallet://delegate?currency=tezos");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "delegate",
        currency: "tezos",
        recipient: undefined,
        amount: undefined,
      });
    });

    it("creates settings route", () => {
      const parsed = parseDeepLink("ledgerwallet://settings/experimental");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "settings",
        path: "experimental",
      });
    });

    it("creates card route", () => {
      const parsed = parseDeepLink("ledgerwallet://card?param=value");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "card",
        query: { param: "value" },
      });
    });

    it("creates discover route", () => {
      const parsed = parseDeepLink("ledgerwallet://discover/paraswap?accountId=123");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "discover",
        path: "paraswap",
        query: { accountId: "123" },
        search: "?accountId=123",
      });
    });

    it("creates wc route", () => {
      const parsed = parseDeepLink("ledgerwallet://wc?uri=wc:test123");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "wc",
        uri: "wc:test123",
        query: { uri: "wc:test123" },
      });
    });

    it("creates market route", () => {
      const parsed = parseDeepLink("ledgerwallet://market/bitcoin");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "market",
        path: "bitcoin",
      });
    });

    it("creates asset route", () => {
      const parsed = parseDeepLink("ledgerwallet://asset/ethereum");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "asset",
        path: "ethereum",
      });
    });

    it("creates recover route", () => {
      const parsed = parseDeepLink("ledgerwallet://recover/protect-setup?step=1");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "recover",
        path: "protect-setup",
        search: "?step=1",
      });
    });

    it("creates recover-restore-flow route", () => {
      const parsed = parseDeepLink("ledgerwallet://recover-restore-flow");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "recover-restore-flow",
      });
    });

    it("creates post-onboarding route", () => {
      const parsed = parseDeepLink("ledgerwallet://post-onboarding?device=stax");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "post-onboarding",
        device: "stax",
      });
    });

    it("creates ledgersync route", () => {
      const parsed = parseDeepLink("ledgerwallet://ledgersync");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "ledgersync",
      });
    });

    it("creates default route for unknown URLs", () => {
      const parsed = parseDeepLink("ledgerwallet://unknown-route");
      const route = createRoute(parsed);
      
      expect(route).toEqual({
        type: "default",
      });
    });
  });
});
