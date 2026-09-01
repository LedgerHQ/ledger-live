import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { createDefaultAccountDataSources, type AccountDataHost } from "./defaults";
import { COIN_MODULE_API_SOURCE_ID } from "./sources/coinModuleApiSource";
import { LEGACY_BRIDGE_SOURCE_ID } from "./sources/legacyBridgeSource";
import { planFetch } from "./router";
import { accountIdFor, makeRef } from "./port.mock";

const evmRef = makeRef({ currencyId: "ethereum" });
const btcRef = makeRef({ currencyId: "bitcoin", accountId: accountIdFor("bc1q") });
const unknownRef = makeRef({ currencyId: "dogecoin", accountId: accountIdFor("D7Y") });

const families: Record<string, string> = { ethereum: "evm", bitcoin: "bitcoin" };

const host = (overrides: Partial<AccountDataHost> = {}): AccountDataHost => ({
  granularFamilies: () => ["evm"],
  familyOf: currencyId => families[currencyId],
  readAssetBalances: async () => [],
  syncAccountBalances: async () => [],
  ...overrides,
});

const sourcesOf = (overrides?: Partial<AccountDataHost>) =>
  createDefaultAccountDataSources(host(overrides));

const byId = (overrides?: Partial<AccountDataHost>) =>
  Object.fromEntries(sourcesOf(overrides).map(source => [source.id, source]));

describe("createDefaultAccountDataSources", () => {
  it("registers the granular source and the legacy fallback", () => {
    expect(sourcesOf().map(source => source.id)).toEqual([
      COIN_MODULE_API_SOURCE_ID,
      LEGACY_BRIDGE_SOURCE_ID,
    ]);
  });

  it("declares balance as a capability for a granular family", () => {
    expect([...byId()[COIN_MODULE_API_SOURCE_ID].capabilities(evmRef)]).toEqual(["balance"]);
  });

  it("declares nothing for a family outside the granular set", () => {
    expect([...byId()[COIN_MODULE_API_SOURCE_ID].capabilities(btcRef)]).toEqual([]);
  });

  it("declares nothing for a currency this app does not know", () => {
    const granular = byId()[COIN_MODULE_API_SOURCE_ID];
    expect([...granular.capabilities(unknownRef)]).toEqual([]);
    expect(granular.supports(unknownRef)).toBe(false);
  });

  it("keeps the legacy fallback off an unknown currency, so the error names the ref", () => {
    expect(byId()[LEGACY_BRIDGE_SOURCE_ID].supports(unknownRef)).toBe(false);
    expect(byId()[LEGACY_BRIDGE_SOURCE_ID].supports(btcRef)).toBe(true);
  });

  it("asks the host for the granular set once, not per capability check", () => {
    const granularFamilies = jest.fn(() => ["evm"]);
    const sources = createDefaultAccountDataSources(host({ granularFamilies }));
    for (const source of sources) {
      source.capabilities(evmRef);
      source.capabilities(btcRef);
    }
    expect(granularFamilies).toHaveBeenCalledTimes(1);
  });

  it("routes a granular family to the coin module", () => {
    const plan = planFetch(evmRef, new Set(["balance"]), sourcesOf());
    expect(plan.map(leg => leg.source.id)).toEqual([COIN_MODULE_API_SOURCE_ID]);
  });

  it("routes a non-granular family to the full sync", () => {
    const plan = planFetch(btcRef, new Set(["balance"]), sourcesOf());
    expect(plan.map(leg => leg.source.id)).toEqual([LEGACY_BRIDGE_SOURCE_ID]);
  });

  it("passes the abort signal through to the host on both paths", async () => {
    const readAssetBalances = jest.fn(async () => []);
    const syncAccountBalances = jest.fn(async () => []);
    const controller = new AbortController();
    const sources = byId({ readAssetBalances, syncAccountBalances });

    for await (const _ of sources[COIN_MODULE_API_SOURCE_ID].fetch({
      ref: evmRef,
      slices: ["balance"],
      reason: "test",
      signal: controller.signal,
    })) {
      // drain
    }
    for await (const _ of sources[LEGACY_BRIDGE_SOURCE_ID].fetch({
      ref: btcRef,
      slices: ["balance"],
      reason: "test",
      signal: controller.signal,
    })) {
      // drain
    }
    expect(readAssetBalances).toHaveBeenCalledWith(evmRef, controller.signal);
    expect(syncAccountBalances).toHaveBeenCalledWith(btcRef, controller.signal);
  });

  it("emits the rows the host returned", async () => {
    const row = mockAccountBalance({ accountId: btcRef.accountId });
    const sources = byId({ syncAccountBalances: async () => [row] });
    for await (const update of sources[LEGACY_BRIDGE_SOURCE_ID].fetch({
      ref: btcRef,
      slices: ["balance"],
      reason: "test",
    })) {
      expect(update.balances).toEqual([row]);
    }
  });
});
