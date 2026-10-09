import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../config";
import { liveConfig } from "../config/sharedConfig";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import {
  LOCAL_NODE_SERVER_URL,
  getLocalNodeConfig,
  getLocalNodeCurrencies,
  loadLocalNodes,
  setLocalNodeCurrencies,
} from ".";
import { LOCAL_CHAINS } from "./server.mock";

const urlsIn = (value: unknown): string[] => {
  if (typeof value === "string") return /^[a-z]+:\/\//i.test(value) ? [value] : [];
  if (value && typeof value === "object") return Object.values(value).flatMap(urlsIn);
  return [];
};

const useLocalNodes = async (currencyIds: string[]) => {
  setLocalNodeCurrencies(currencyIds);
  await loadLocalNodes();
};

/** The usual configuration of every currency, with `changes` on top: what Firebase would serve. */
const withRemoteConfig = (changes: Record<string, unknown>) => {
  const getValueByKey = LiveConfig.getValueByKey.bind(LiveConfig);
  jest
    .spyOn(LiveConfig, "getValueByKey")
    .mockImplementation(key => ({ ...getValueByKey(key), ...changes }));
};

const usual = (currencyId: string) => LiveConfig.getValueByKey(`config_currency_${currencyId}`);

describe("localNode", () => {
  const server = setupServer(
    http.get(`${LOCAL_NODE_SERVER_URL}/:family/chains`, ({ params }) => {
      const chains = LOCAL_CHAINS[String(params.family)];
      return chains
        ? HttpResponse.json(chains)
        : HttpResponse.json({ error: `Unsupported family: ${params.family}` }, { status: 400 });
    }),
  );

  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    setLocalNodeCurrencies([]);
    server.resetHandlers();
    jest.restoreAllMocks();
  });

  afterAll(() => server.close());

  it.each(Object.values(LOCAL_CHAINS).flatMap(chains => chains.map(({ network }) => network)))(
    "only points %s at localhost, and keeps the rest of its usual configuration",
    async currencyId => {
      const defaults = usual(currencyId);
      await useLocalNodes([currencyId]);

      const config = getLocalNodeConfig(currencyId);
      const urls = urlsIn(config);

      expect(urls.length).toBeGreaterThan(0);
      expect(urls.map(url => new URL(url).hostname)).toEqual(urls.map(() => "localhost"));
      // Only EVM chains have a chain id: compare field by field, so an absent one matches too.
      for (const field of ["chainId", "name", "unit", "status"]) {
        expect(config?.[field as keyof typeof config]).toEqual(defaults[field]);
      }
    },
  );

  it("moves a Blockscout chain's node and explorer to its local node and Blockscout", async () => {
    await useLocalNodes(["base"]);

    const config = getLocalNodeConfig("base");
    expect(config).toMatchObject({
      chainId: 8453,
      node: { type: "external", uri: "http://localhost:8548" },
      explorer: { type: "blockscout", uri: "http://localhost:4003/api" },
    });
    expect(config).not.toHaveProperty("gasTracker");
  });

  it("points an Atlas chain's Ledger clients at the local Atlas", async () => {
    await useLocalNodes(["ethereum"]);

    expect(getLocalNodeConfig("ethereum")).toMatchObject({
      chainId: 1,
      node: { type: "ledger", explorerId: "eth" },
      explorer: { type: "ledger", explorerId: "eth" },
      gasTracker: { type: "ledger", explorerId: "eth" },
      ledgerExplorerUri: "http://localhost:4032",
    });
  });

  it("points Tron at its local TronGrid API, without energy rental", async () => {
    await useLocalNodes(["tron"]);

    const config = getLocalNodeConfig("tron");
    expect(config).toMatchObject({ explorer: { url: "http://localhost:9090" } });
    expect(usual("tron")).toHaveProperty("energyRent");
    expect(config).not.toHaveProperty("energyRent");
  });

  it("points Solana at its local validator, without the mainnet validator list", async () => {
    await useLocalNodes(["solana"]);

    const config = getLocalNodeConfig("solana");
    expect(config).toMatchObject({ rpcUrls: { solana: "http://localhost:8899" } });
    expect(usual("solana")).toHaveProperty("validatorsUrl");
    expect(config).not.toHaveProperty("validatorsUrl");
  });

  it("keeps what the remote configuration changes, except the endpoints", async () => {
    withRemoteConfig({ feeHistoryBlockCount: 42, node: "https://xrp.example.com" });
    await useLocalNodes(["ripple"]);

    expect(getLocalNodeConfig("ripple")).toMatchObject({
      feeHistoryBlockCount: 42,
      node: "http://localhost:5005",
    });
  });

  it("keeps every currency on its default network until one is selected", async () => {
    await loadLocalNodes();

    expect(getLocalNodeCurrencies()).toEqual([]);
    expect(getLocalNodeConfig("base")).toBeUndefined();
  });

  it("serves only the selected currencies", async () => {
    await useLocalNodes(["base", "ripple"]);

    expect(getLocalNodeCurrencies()).toEqual(["base", "ripple"]);
    expect(getLocalNodeConfig("ripple")).toBeDefined();
    expect(getLocalNodeConfig("arbitrum")).toBeUndefined();
  });

  describe("refuses to run a selected currency anywhere but its local node", () => {
    const notLoaded = "The local node of base is not loaded";

    it("before its chain is loaded", () => {
      setLocalNodeCurrencies(["base"]);

      expect(() => getLocalNodeConfig("base")).toThrow(notLoaded);
    });

    it("when the server is down", async () => {
      server.use(http.get(`${LOCAL_NODE_SERVER_URL}/:family/chains`, () => HttpResponse.error()));
      setLocalNodeCurrencies(["base"]);

      await expect(loadLocalNodes()).rejects.toThrow("deno task server");
      expect(() => getLocalNodeConfig("base")).toThrow(notLoaded);
    });

    it("when coin-sandbox has no chain for it", async () => {
      setLocalNodeCurrencies(["base", "arbitrum"]);

      await expect(loadLocalNodes()).rejects.toThrow("coin-sandbox has no chain for arbitrum");
      expect(() => getLocalNodeConfig("base")).toThrow(notLoaded);
    });

    it("when Ledger Live cannot run its family locally", async () => {
      setLocalNodeCurrencies(["base", "stellar"]);
      expect(LOCAL_CHAINS).not.toHaveProperty("stellar");

      await expect(loadLocalNodes()).rejects.toThrow("cannot run stellar on a local node");
    });

    it("when its configuration has a remote URL no local endpoint replaces", async () => {
      withRemoteConfig({ statusPage: "https://status.example.com" });
      setLocalNodeCurrencies(["ripple"]);

      await expect(loadLocalNodes()).rejects.toThrow("statusPage = https://status.example.com");
      expect(() => getLocalNodeConfig("ripple")).toThrow("is not loaded");
    });

    it("when a Ledger client is left without a local base URL", async () => {
      withRemoteConfig({ nodeSources: { type: "ledger", explorerId: "base" } });
      setLocalNodeCurrencies(["base"]);

      await expect(loadLocalNodes()).rejects.toThrow("nodeSources = Ledger's explorers");
    });

    it("when the remote configuration gains a remote URL after loading", async () => {
      await useLocalNodes(["ripple"]);
      withRemoteConfig({ statusPage: "https://status.example.com" });

      expect(() => getLocalNodeConfig("ripple")).toThrow("still reaches its real network");
    });
  });

  describe("currency configuration", () => {
    it("replaces the default configuration of a local currency", async () => {
      await useLocalNodes(["base"]);

      expect(getCurrencyConfiguration("base")).toEqual(getLocalNodeConfig("base"));
    });

    it("leaves the other currencies on their default configuration", async () => {
      await useLocalNodes(["base"]);

      expect(getCurrencyConfiguration("arbitrum")).toEqual(usual("arbitrum"));
    });

    it("reaches coin modules through the context they are called with", async () => {
      await useLocalNodes(["base"]);

      await expect(buildContext("base").config()).resolves.toEqual(getLocalNodeConfig("base"));
      await expect(buildContext("arbitrum").config("base")).resolves.toEqual(
        getLocalNodeConfig("base"),
      );
    });
  });
});
