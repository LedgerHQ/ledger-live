import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setZcashShieldedEnabled } from "../zcashRouting";
import { genAccount } from "../../mock/account";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import {
  clearBridgeCache,
  getAccountBridge,
  getAccountBridgeByFamily,
  getCurrencyBridge,
} from "../impl";

const ZCASH = getCryptoCurrencyById("zcash");
const BITCOIN = getCryptoCurrencyById("bitcoin");

const loadersFor = (...families: string[]) =>
  coinModuleLoaders.filter(l => families.includes(l.family));

// Same modules the loaders import, so the bridges compare by identity.
const coinZcash = () => import("../../families/zcash/setup");
const coinBitcoin = () => import("../../families/bitcoin/setup");

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

  it("serves the zcash currency bridge from coin-zcash when the flag is on", async () => {
    setZcashShieldedEnabled(true);

    expect(await getCurrencyBridge(ZCASH)).toBe((await coinZcash()).bridge.currencyBridge);
  });

  it("leaves zcash on coin-bitcoin's currency bridge when the flag is off", async () => {
    expect(await getCurrencyBridge(ZCASH)).toBe((await coinBitcoin()).bridge.currencyBridge);
  });

  it("shares the bitcoin family entry when the flag is off, as an unrouted currency would", () => {
    expect(getCurrencyBridge(ZCASH)).toBe(getCurrencyBridge(BITCOIN));
  });

  it("never moves another currency of the bitcoin family", async () => {
    setZcashShieldedEnabled(true);

    expect(await getCurrencyBridge(BITCOIN)).toBe((await coinBitcoin()).bridge.currencyBridge);
  });

  it("routes a zcash account to the module the flag names", async () => {
    const account = genAccount("zcash-routing-test", { currency: ZCASH });

    setZcashShieldedEnabled(true);
    const onBridge = await getAccountBridge(account);
    setZcashShieldedEnabled(false);
    const offBridge = await getAccountBridge(account);

    // getAccountBridge wraps the module's bridge (sanction checks, extensions),
    // so the wrapper is new but the methods it spreads come from the module.
    expect(onBridge.createTransaction).toBe(
      (await coinZcash()).bridge.accountBridge.createTransaction,
    );
    // Flag off, the account is served the bitcoin family bridge itself — the
    // very entry every other bitcoin-family currency gets, as on develop.
    expect(offBridge).toBe(await getAccountBridgeByFamily("bitcoin", account.id));
    expect(offBridge.createTransaction).not.toBe(onBridge.createTransaction);
  });

  it("resolves the coin-zcash bridge again when the flag flips back", async () => {
    const account = genAccount("zcash-flip-test", { currency: ZCASH });

    setZcashShieldedEnabled(true);
    const onBridge = await getAccountBridge(account);
    setZcashShieldedEnabled(false);
    await getAccountBridge(account);
    setZcashShieldedEnabled(true);

    expect(await getAccountBridge(account)).toBe(onBridge);
  });

  it("evicts the zcash entry on clearBridgeCache('zcash')", async () => {
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
