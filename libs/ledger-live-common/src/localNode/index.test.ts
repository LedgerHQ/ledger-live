import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../config";
import { liveConfig } from "../config/sharedConfig";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import {
  LOCAL_NODE_ENDPOINTS,
  getLocalNodeConfig,
  getLocalNodeCurrencies,
  setLocalNodeCurrencies,
} from ".";

const urlsIn = (value: unknown): string[] => {
  if (typeof value === "string") return /^[a-z]+:\/\//i.test(value) ? [value] : [];
  if (value && typeof value === "object") return Object.values(value).flatMap(urlsIn);
  return [];
};

const LOCAL_CURRENCIES = Object.keys(LOCAL_NODE_ENDPOINTS);

describe("localNode", () => {
  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
  });

  afterEach(() => {
    setLocalNodeCurrencies([]);
    jest.restoreAllMocks();
  });

  it.each(LOCAL_CURRENCIES)("only points %s at localhost, and keeps its chain", currencyId => {
    const defaults = LiveConfig.getValueByKey(`config_currency_${currencyId}`);
    setLocalNodeCurrencies([currencyId]);

    const config = getLocalNodeConfig(currencyId);
    const urls = urlsIn(config);

    expect(defaults).toBeDefined();
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.map(url => new URL(url).hostname)).toEqual(urls.map(() => "localhost"));
    // Only EVM chains have a chain id: compare field by field, so an absent one matches too.
    for (const field of ["chainId", "name", "unit", "status"]) {
      expect(config?.[field as keyof typeof config]).toEqual(defaults[field]);
    }
  });

  it("gives every currency ports of its own, so several can run at once", () => {
    const ports = LOCAL_CURRENCIES.flatMap(currencyId =>
      urlsIn(LOCAL_NODE_ENDPOINTS[currencyId]).map(url => new URL(url).port),
    );

    expect(new Set(ports).size).toBe(ports.length);
  });

  it("serves a coin-sandbox chain through its own node and Blockscout", () => {
    setLocalNodeCurrencies(["base"]);

    expect(getLocalNodeConfig("base")).toMatchObject({
      chainId: 8453,
      node: { type: "external", uri: "http://localhost:8548" },
      explorer: { type: "blockscout", uri: "http://localhost:4003/api" },
    });
    expect(getLocalNodeConfig("base")).not.toHaveProperty("gasTracker");
  });

  it("keeps every currency on its default network until one is selected", () => {
    expect(getLocalNodeCurrencies()).toEqual([]);
    expect(getLocalNodeConfig("base")).toBeUndefined();
  });

  it("serves only the selected currencies", () => {
    setLocalNodeCurrencies(["base", "sonic"]);

    expect(getLocalNodeCurrencies()).toEqual(["base", "sonic"]);
    expect(getLocalNodeConfig("sonic")).toBeDefined();
    expect(getLocalNodeConfig("arbitrum")).toBeUndefined();
  });

  it("rejects a currency that has no local node", () => {
    expect(() => setLocalNodeCurrencies(["base", "solana"])).toThrow("No local node for solana");
    expect(getLocalNodeCurrencies()).toEqual([]);
  });

  describe("currency configuration", () => {
    it("replaces the default configuration of a local currency", () => {
      setLocalNodeCurrencies(["base"]);

      expect(getCurrencyConfiguration("base")).toEqual(getLocalNodeConfig("base"));
    });

    it("leaves the other currencies on their default configuration", () => {
      setLocalNodeCurrencies(["base"]);

      expect(getCurrencyConfiguration("arbitrum")).toEqual(
        LiveConfig.getValueByKey("config_currency_arbitrum"),
      );
    });

    it("reaches coin modules through the context they are called with", async () => {
      setLocalNodeCurrencies(["base"]);

      await expect(buildContext("base").config()).resolves.toEqual(getLocalNodeConfig("base"));
      await expect(buildContext("arbitrum").config("base")).resolves.toEqual(
        getLocalNodeConfig("base"),
      );
    });
  });
});
