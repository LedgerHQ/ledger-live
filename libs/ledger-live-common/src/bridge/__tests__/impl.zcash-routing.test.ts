import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { BigNumber } from "bignumber.js";
import { EMPTY } from "rxjs";
import type { Account, SignOperationArg0, TransactionCommon } from "@ledgerhq/types-live";
import { setZcashShieldedEnabled } from "../zcashRouting";
import { encodeAccountId } from "../../account";
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
const ZCASH_TESTNET = getCryptoCurrencyById("zcash_testnet");
const BITCOIN = getCryptoCurrencyById("bitcoin");

const loadersFor = (...families: string[]) =>
  coinModuleLoaders.filter(l => families.includes(l.family));

// Same modules the loaders import, so the bridges compare by identity.
const coinZcash = () => import("../../families/zcash/setup");
const coinBitcoin = () => import("../../families/bitcoin/setup");

// genAccount gives a `mock:` id, which getAccountBridge serves from a family's
// mock bridge. A `js:` id keeps the account on the module bridges.
const genRoutedAccount = (name: string): Account => {
  const account = genAccount(name, { currency: ZCASH });
  return {
    ...account,
    id: encodeAccountId({
      type: "js",
      version: "2",
      currencyId: ZCASH.id,
      xpubOrAddress: account.freshAddress,
      derivationMode: account.derivationMode,
    }),
  };
};

// The module's signOperation is stubbed in the routing tests, so the
// transaction only has to type-check -- nothing reads it.
const signArg = (account: Account): SignOperationArg0<TransactionCommon, Account> => ({
  account,
  transaction: { amount: new BigNumber(0), recipient: account.freshAddress },
  deviceId: "",
});

// Every Zcash account is served by coin-zcash; the `zcashShielded` flag the host
// mirrors here only selects, inside coin-zcash, whether the shielded engine runs.
describe("bridge/impl -- zcash routing", () => {
  beforeEach(() => {
    resetCoinModulesForTests();
    registerCoinModules(loadersFor("bitcoin", "zcash"));
    clearBridgeCache();
    setZcashShieldedEnabled(false);
  });

  // The setup modules are singletons shared by every test here, so spies on
  // their bridges have to be undone.
  afterEach(() => jest.restoreAllMocks());

  afterAll(() => setZcashShieldedEnabled(false));

  it.each([true, false])(
    "serves the zcash currency bridge from coin-zcash (flag %s)",
    async enabled => {
      setZcashShieldedEnabled(enabled);

      expect(await getCurrencyBridge(ZCASH)).toBe((await coinZcash()).bridge.currencyBridge);
    },
  );

  it("serves zcash testnet from coin-zcash too", async () => {
    expect(await getCurrencyBridge(ZCASH_TESTNET)).toBe((await coinZcash()).bridge.currencyBridge);
  });

  it("never moves another currency of the bitcoin family", async () => {
    expect(await getCurrencyBridge(BITCOIN)).toBe((await coinBitcoin()).bridge.currencyBridge);
  });

  it("keeps zcash on its currency family when the host registers no zcash module", async () => {
    resetCoinModulesForTests();
    registerCoinModules(loadersFor("bitcoin"));
    clearBridgeCache();

    expect(await getCurrencyBridge(ZCASH)).toBe((await coinBitcoin()).bridge.currencyBridge);
  });

  it("evicts the zcash entry on clearBridgeCache('zcash')", async () => {
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

  // getAccountBridge replaces signOperation with its observability wrapper, so
  // the routed method is never the module's own by identity. The wrapper reads
  // `bridge.signOperation` off the module at call time, so calling through it
  // is what shows which module signs.
  it.each([true, false])("signs a zcash send with coin-zcash (flag %s)", async enabled => {
    setZcashShieldedEnabled(enabled);
    const account = genRoutedAccount(`zcash-sign-test-${enabled}`);
    const zcashSignOperation = jest
      .spyOn((await coinZcash()).bridge.accountBridge, "signOperation")
      .mockReturnValue(EMPTY);
    const bitcoinSignOperation = jest
      .spyOn((await coinBitcoin()).bridge.accountBridge, "signOperation")
      .mockReturnValue(EMPTY);

    const bridge = await getAccountBridge(account);
    bridge.signOperation(signArg(account)).subscribe();

    expect(zcashSignOperation).toHaveBeenCalledTimes(1);
    expect(bitcoinSignOperation).not.toHaveBeenCalled();
  });
});
