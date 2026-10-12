import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { nearConfig } from "../families/near/config";
import { stacksConfig } from "../families/stacks/config";
import { coinModuleLoaders } from "../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../coin-modules/registry";
import { clearBridgeCache, getAccountBridgeByFamily, getCurrencyBridge } from ".";

const NEAR = getCryptoCurrencyById("near");
const KEY = "config_near_generic_bridge";

// The legacy currency bridge exposes preload/hydrate/getPreloadStrategy; the generic one returns
// scanAccounts alone. The bridge is cached per family, so the key only takes effect after eviction.
const setKey = (value: boolean) => {
  LiveConfig.setOverride(KEY, value);
  clearBridgeCache("near");
};

describe("generic coin-framework routing gate", () => {
  beforeAll(() => {
    LiveConfig.setConfig(nearConfig);
    resetCoinModulesForTests();
    registerCoinModules(coinModuleLoaders.filter(l => l.family === "near"));
  });

  afterAll(() => {
    LiveConfig.setOverride(KEY, undefined);
    resetCoinModulesForTests();
    clearBridgeCache();
  });

  test("ships defaulting to the legacy bridge, with no override set", async () => {
    LiveConfig.setOverride(KEY, undefined);
    clearBridgeCache("near");

    expect(nearConfig[KEY].default).toBe(false);
    expect("preload" in (await getCurrencyBridge(NEAR))).toBe(true);
  });

  test("keeps NEAR on the legacy bridge while the key is off", async () => {
    setKey(false);

    const bridge = await getCurrencyBridge(NEAR);

    expect("preload" in bridge).toBe(true);
  });

  test("routes NEAR through the generic bridge once the key is on", async () => {
    setKey(true);

    const bridge = await getCurrencyBridge(NEAR);

    expect("preload" in bridge).toBe(false);
  });

  test("returns to the legacy bridge when the key is turned back off", async () => {
    setKey(true);
    await getCurrencyBridge(NEAR);

    setKey(false);
    const bridge = await getCurrencyBridge(NEAR);

    expect("preload" in bridge).toBe(true);
  });
});

// Stacks' legacy currency bridge has no preload, so the account bridge tells the routes apart: only
// the generic one carries the token sub-account raw hooks.
describe("generic coin-framework routing gate (Stacks incident recovery)", () => {
  const STACKS_KEY = "config_stacks_generic_bridge";
  const setStacksKey = (value: boolean | undefined) => {
    LiveConfig.setOverride(STACKS_KEY, value);
    clearBridgeCache("stacks");
  };
  const isGeneric = async () =>
    "assignFromTokenAccountRaw" in (await getAccountBridgeByFamily("stacks"));

  beforeAll(() => {
    LiveConfig.setConfig(stacksConfig);
    resetCoinModulesForTests();
    registerCoinModules(coinModuleLoaders.filter(l => l.family === "stacks"));
  });

  afterAll(() => {
    LiveConfig.setOverride(STACKS_KEY, undefined);
    resetCoinModulesForTests();
    clearBridgeCache();
  });

  test("ships defaulting to the generic bridge, with no override set", async () => {
    setStacksKey(undefined);

    expect(stacksConfig[STACKS_KEY].default).toBe(true);
    expect(await isGeneric()).toBe(true);
  });

  test("routes Stacks through the generic bridge while the key is on", async () => {
    setStacksKey(true);

    expect(await isGeneric()).toBe(true);
  });

  test("falls back to the legacy bridge once the key is turned off and the cache evicted", async () => {
    setStacksKey(true);
    await getAccountBridgeByFamily("stacks");

    setStacksKey(false);

    expect(await isGeneric()).toBe(false);
  });
});
