import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  listCryptoCurrencies,
  hasCryptoCurrencyId,
  getCryptoCurrencyById,
  findCryptoCurrency,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByTicker,
  findCryptoCurrencyByKeyword,
  findCryptoCurrencyByManagerAppName,
} from "./currencies";
import { getInjectedCurrenciesStore, setCryptoCurrenciesStore } from "./currencies-store";

const makeCurrency = (id: string, extra: Partial<CryptoCurrency> = {}): CryptoCurrency =>
  ({
    id,
    name: `${id} name`,
    ticker: id.toUpperCase(),
    scheme: id,
    managerAppName: `${id} App`,
    keywords: [`${id}-kw`],
    ...extra,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }) as unknown as CryptoCurrency;

// One sentinel per list bucket: the dev/prod split is `!isTestnetFor`.
const prodActive = makeCurrency("inj_prod_active");
const prodActive2 = makeCurrency("inj_prod_active_2");
const devActive = makeCurrency("inj_dev_active", { isTestnetFor: "inj_prod_active" });

// The caller only passes the list; the store derives every index/array from it.
const injectedCurrencies = [prodActive, prodActive2, devActive];

function clearInjectedStore() {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  (globalThis as Record<string, unknown>).__ledgerCryptoCurrenciesStore = undefined;
}

describe("currencies-store: no store injected (bundled fallback)", () => {
  afterEach(clearInjectedStore);

  it("getInjectedCurrenciesStore returns undefined and never throws", () => {
    expect(getInjectedCurrenciesStore()).toBeUndefined();
  });

  it("accessors resolve against the bundled registry", () => {
    expect(getCryptoCurrencyById("bitcoin")).toMatchObject({ id: "bitcoin" });
    expect(hasCryptoCurrencyId("bitcoin")).toBe(true);
    // Inherited Object.prototype keys are not currency ids (own-property check).
    expect(hasCryptoCurrencyId("toString")).toBe(false);
    // The injected sentinels are absent from the bundled data.
    expect(findCryptoCurrencyById(prodActive.id)).toBeUndefined();
  });
});

describe("currencies-store: store injected", () => {
  beforeEach(() => setCryptoCurrenciesStore(injectedCurrencies));
  afterEach(clearInjectedStore);

  it("reads the injected registry and ignores bundled data", () => {
    // The derived store is computed from the list (not the list object itself).
    expect(getInjectedCurrenciesStore()?.cryptocurrenciesArray).toEqual(injectedCurrencies);
    expect(getCryptoCurrencyById(prodActive.id)).toBe(prodActive);
    expect(findCryptoCurrencyById(prodActive.id)).toBe(prodActive);
    // bitcoin is bundled-only — now invisible.
    expect(findCryptoCurrencyById("bitcoin")).toBeUndefined();
    expect(() => getCryptoCurrencyById("bitcoin")).toThrow('currency with id "bitcoin" not found');
  });

  it("routes hasCryptoCurrencyId through the injected map", () => {
    expect(hasCryptoCurrencyId(prodActive.id)).toBe(true);
    expect(hasCryptoCurrencyId("bitcoin")).toBe(false);
  });

  it("routes ticker / scheme / predicate lookups", () => {
    expect(findCryptoCurrencyByTicker(prodActive.ticker)).toBe(prodActive);
    expect(findCryptoCurrencyByScheme(prodActive.scheme)).toBe(prodActive);
    expect(findCryptoCurrency(c => c.id === devActive.id)).toBe(devActive);
  });

  it("routes keyword and manager-app lookups (which compose the leaf accessors)", () => {
    expect(findCryptoCurrencyByKeyword("inj_prod_active-kw")).toBe(prodActive);
    expect(findCryptoCurrencyByManagerAppName(prodActive.managerAppName)).toBe(prodActive);
  });

  it("listCryptoCurrencies selects the correct bucket per withDevCrypto", () => {
    expect(listCryptoCurrencies()).toEqual([prodActive, prodActive2]);
    expect(listCryptoCurrencies(true)).toEqual([prodActive, prodActive2, devActive]);
  });

  it("restores bundled fallback once cleared", () => {
    clearInjectedStore();
    expect(getCryptoCurrencyById("bitcoin")).toMatchObject({ id: "bitcoin" });
  });
});
