import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { setLocalNodeCurrencies } from ".";
import {
  LOCAL_NODE_TOKENS,
  LOCAL_NODE_TOKEN_LISTS,
  getLocalNodeTokens,
  withLocalNodeTokens,
} from "./tokens";

const [USDC] = LOCAL_NODE_TOKENS.stellar;
const ISSUER = USDC.contractAddress;

const remoteStore = (): jest.Mocked<CryptoAssetsStore> => ({
  findTokenById: jest.fn().mockResolvedValue(undefined),
  findTokenByAddressInCurrency: jest.fn().mockResolvedValue(undefined),
  getTokensSyncHash: jest.fn().mockResolvedValue("hash"),
});

describe("local node tokens", () => {
  afterEach(() => setLocalNodeCurrencies([]));

  it("describes the local USDC the way Stellar code reads it", () => {
    expect(USDC).toMatchObject({
      id: `stellar/asset/USDC:${ISSUER}`,
      parentCurrencyId: "stellar",
      tokenType: "stellar",
      tokenIdentifier: "USDC",
      name: "USDC",
      units: [{ magnitude: 7 }],
    });
  });

  it("lists the local tokens only while their currency runs locally", () => {
    expect(getLocalNodeTokens("stellar")).toEqual([]);

    setLocalNodeCurrencies(["stellar"]);

    expect(getLocalNodeTokens("stellar")).toEqual([USDC]);
    expect(getLocalNodeTokens("ripple")).toEqual([]);
  });

  describe("withLocalNodeTokens", () => {
    it("resolves a local token the ways sync, restore and send look it up", async () => {
      setLocalNodeCurrencies(["stellar"]);
      const remote = remoteStore();
      const store = withLocalNodeTokens(remote);

      // sync: issuer + asset code
      await expect(store.findTokenByAddressInCurrency(ISSUER, "stellar", "USDC")).resolves.toBe(
        USDC,
      );
      // restore: token id
      await expect(store.findTokenById(USDC.id)).resolves.toBe(USDC);
      // decodeTokenAccountId fallback: the id passed as the address, no identifier
      await expect(store.findTokenByAddressInCurrency(USDC.id, "stellar")).resolves.toBe(USDC);
      expect(remote.findTokenById).not.toHaveBeenCalled();
      expect(remote.findTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("delegates everything else to the crypto-assets service", async () => {
      setLocalNodeCurrencies(["stellar"]);
      const remote = remoteStore();
      const store = withLocalNodeTokens(remote);

      await store.findTokenByAddressInCurrency(ISSUER, "stellar", "EURC");
      await store.findTokenByAddressInCurrency(ISSUER, "ethereum", "USDC");
      await store.findTokenById("ethereum/erc20/usd__coin");

      expect(remote.findTokenByAddressInCurrency).toHaveBeenCalledTimes(2);
      expect(remote.findTokenById).toHaveBeenCalledWith("ethereum/erc20/usd__coin");
      await expect(store.getTokensSyncHash("stellar")).resolves.toBe("hash");
    });

    it("knows no local token while the currency runs on its default network", async () => {
      const remote = remoteStore();
      const store = withLocalNodeTokens(remote);

      await expect(store.findTokenById(USDC.id)).resolves.toBeUndefined();
      expect(remote.findTokenById).toHaveBeenCalledWith(USDC.id);
    });
  });

  describe("tokens listed by the local node", () => {
    const TRC20 = {
      type: "TokenCurrency",
      id: "tron/trc20/tgj3d5xvexcdrdcdf2cpqxnourm1fzfoxs",
      contractAddress: "TGJ3D5XVeXcdrdCdF2cpqXNoURm1FZfoXs",
      parentCurrencyId: "tron",
      tokenType: "trc20",
      name: "Tether USD",
      ticker: "USDT",
      delisted: false,
      disableCountervalue: true,
      units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
    };
    const server = setupServer();
    let now = Date.now();

    beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
    // Lists are cached briefly: start each test past the previous one's cache
    beforeEach(() => {
      now += 60_000;
      jest.spyOn(Date, "now").mockImplementation(() => now);
    });
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it("resolves a token the node lists, the way sync and restore look it up", async () => {
      setLocalNodeCurrencies(["tron"]);
      server.use(http.get(LOCAL_NODE_TOKEN_LISTS.tron, () => HttpResponse.json([TRC20])));
      const store = withLocalNodeTokens(remoteStore());

      await expect(
        store.findTokenByAddressInCurrency(TRC20.contractAddress, "tron"),
      ).resolves.toMatchObject({ id: TRC20.id });
      await expect(store.findTokenById(TRC20.id)).resolves.toMatchObject({ ticker: "USDT" });
    });

    it("asks the node once per short period, not once per lookup", async () => {
      setLocalNodeCurrencies(["tron"]);
      let calls = 0;
      server.use(
        http.get(LOCAL_NODE_TOKEN_LISTS.tron, () => {
          calls++;
          return HttpResponse.json([TRC20]);
        }),
      );
      const store = withLocalNodeTokens(remoteStore());

      await store.findTokenById(TRC20.id);
      await store.findTokenById(TRC20.id);
      await store.findTokenByAddressInCurrency(TRC20.contractAddress, "tron");

      expect(calls).toBe(1);
    });

    it("falls back to the crypto-assets service when the local node is down", async () => {
      setLocalNodeCurrencies(["tron"]);
      server.use(http.get(LOCAL_NODE_TOKEN_LISTS.tron, () => HttpResponse.error()));
      const remote = remoteStore();
      const store = withLocalNodeTokens(remote);

      await expect(store.findTokenById(TRC20.id)).resolves.toBeUndefined();
      expect(remote.findTokenById).toHaveBeenCalledWith(TRC20.id);
    });
  });
});
