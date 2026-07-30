import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setZcashShieldedEnabled } from "../zcashRouting";
import { genAccount } from "../../mock/account";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import { clearBridgeCache, getAccountBridge, getCurrencyBridge, resolveFamily } from "../impl";

const ZCASH = getCryptoCurrencyById("zcash");
const BITCOIN = getCryptoCurrencyById("bitcoin");

const loadersFor = (...families: string[]) =>
  coinModuleLoaders.filter(l => families.includes(l.family));

// The host app resolves the flag itself -- remote config, env override and the
// developer drawer's override all folded in -- and mirrors that resolution here
// (`setZcashShieldedEnabled`). The router reads that same mirror, so a flag
// flipped from the drawer moves the routing with it.
describe("bridge/impl -- zcash routing (zcashShielded flag)", () => {
  beforeEach(() => {
    resetCoinModulesForTests();
    registerCoinModules(loadersFor("bitcoin", "zcash"));
    clearBridgeCache();
    setZcashShieldedEnabled(false);
  });

  afterAll(() => setZcashShieldedEnabled(false));

  it("resolveFamily returns 'zcash' when the flag is on", () => {
    setZcashShieldedEnabled(true);
    expect(resolveFamily(ZCASH)).toBe("zcash");
  });

  it("resolveFamily returns 'bitcoin' when the flag is off", () => {
    expect(resolveFamily(ZCASH)).toBe("bitcoin");
  });

  it("resolveFamily follows a flip within the session", () => {
    setZcashShieldedEnabled(true);
    expect(resolveFamily(ZCASH)).toBe("zcash");
    setZcashShieldedEnabled(false);
    expect(resolveFamily(ZCASH)).toBe("bitcoin");
  });

  it("resolveFamily never touches any other currency's family", () => {
    setZcashShieldedEnabled(true);
    expect(resolveFamily(BITCOIN)).toBe("bitcoin");
  });

  it("getCurrencyBridge resolves the coin-zcash currencyBridge when the flag is ON", async () => {
    setZcashShieldedEnabled(true);
    const bridge = await getCurrencyBridge(ZCASH);
    expect(bridge).toBeDefined();
    expect(typeof bridge.scanAccounts).toBe("function");
  });

  it("getCurrencyBridge resolves the coin-bitcoin currencyBridge when the flag is OFF", async () => {
    const bridge = await getCurrencyBridge(ZCASH);
    expect(bridge).toBeDefined();
    expect(typeof bridge.scanAccounts).toBe("function");
  });

  it("getAccountBridge routes a zcash account to the right family bridge in both flag states, with no cache leak", async () => {
    const account = genAccount("zcash-routing-test", { currency: ZCASH });

    setZcashShieldedEnabled(true);
    const onBridge = await getAccountBridge(account);
    expect(onBridge).toBeDefined();

    setZcashShieldedEnabled(false);
    const offBridge = await getAccountBridge(account);
    expect(offBridge).toBeDefined();

    // Distinct family caches (bitcoin vs zcash) -- flipping the flag back must
    // resolve the ON bridge again rather than staying stuck on the OFF one.
    setZcashShieldedEnabled(true);
    const onBridgeAgain = await getAccountBridge(account);
    expect(onBridgeAgain).toBe(onBridge);
    expect(onBridgeAgain).not.toBe(offBridge);
  });

  it("clearBridgeCache('zcash') evicts the zcash entry despite its composite key", async () => {
    setZcashShieldedEnabled(true);
    const account = genAccount("zcash-cache-eviction-test", { currency: ZCASH });
    const first = getAccountBridge(account);
    await first;

    expect(getAccountBridge(account)).toBe(first);

    clearBridgeCache("zcash");

    // A fresh Promise, which is what lets a caller retry a bridge whose load
    // rejected -- rejections stay cached until something evicts them.
    const afterClear = getAccountBridge(account);
    expect(afterClear).not.toBe(first);
    await afterClear;
  });
});
