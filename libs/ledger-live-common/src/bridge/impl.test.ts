import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import { AccountNotSupported, CurrencyNotSupported } from "@ledgerhq/errors";
import { initialBitcoinResourcesValue } from "@ledgerhq/coin-bitcoin/types";
import type { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import type { DerivationMode } from "@ledgerhq/types-live";
import { genAccount } from "../mock/account";
import { coinModuleLoaders } from "../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../coin-modules/registry";
import { getAccountBridge, clearBridgeCache } from ".";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");

const loadersFor = (...families: string[]) =>
  coinModuleLoaders.filter(l => families.includes(l.family));

// bitcoin + evm registered, tron absent → getAccountBridge(tron) rejects CurrencyNotSupported.
const registerWithoutTron = () => {
  resetCoinModulesForTests();
  registerCoinModules(loadersFor("bitcoin", "evm"));
  clearBridgeCache();
};
registerWithoutTron();

describe("wrapAccountBridge — extension routing", () => {
  test("bitcoin clearAccount resets bitcoinResources (coin-specific override)", async () => {
    const account = genAccount("btc-clear-routing", { currency: BTC }) as BitcoinAccount;
    // Mutate to simulate state that the family-specific clearAccount must wipe.
    account.bitcoinResources = {
      utxos: [{ hash: "deadbeef" } as unknown as BitcoinAccount["bitcoinResources"]["utxos"][0]],
      walletAccount: {
        foo: "bar",
      } as unknown as BitcoinAccount["bitcoinResources"]["walletAccount"],
    };
    account.operations = [{ id: "op1" } as unknown as BitcoinAccount["operations"][0]];
    account.blockHeight = 999;

    const bridge = await getAccountBridge(account);
    const cleared = bridge.clearAccount(account) as BitcoinAccount;

    expect(cleared.bitcoinResources).toEqual(initialBitcoinResourcesValue);
    expect(cleared.operations).toEqual([]);
    expect(cleared.blockHeight).toBe(0);
  });

  test("clearAccount on a family without override falls back to framework default", async () => {
    const account = genAccount("eth-clear-default", { currency: ETH });
    account.operations = [{ id: "op1" } as unknown as (typeof account.operations)[0]];
    account.blockHeight = 42;

    const bridge = await getAccountBridge(account);
    const cleared = bridge.clearAccount(account);

    expect(cleared.operations).toEqual([]);
    expect(cleared.blockHeight).toBe(0);
  });

  test("isAccountEmpty default returns true for an empty account", async () => {
    const account = genAccount("eth-empty", { currency: ETH });
    account.operations = [];
    account.operationsCount = 0;
    account.balance = new BigNumber(0);
    account.subAccounts = [];

    const bridge = await getAccountBridge(account);
    expect(bridge.isAccountEmpty(account)).toBe(true);
  });
});

describe("getAccountBridge — unsupported account rejection", () => {
  function makeUnsupportedCurrencyAccount(id: string, family = "tron") {
    const account = genAccount(id, { currency: BTC });
    return { ...account, currency: getCryptoCurrencyById(family) };
  }

  function makeUnsupportedDerivationAccount(id: string) {
    const account = genAccount(id, { currency: BTC });
    return {
      ...account,
      derivationMode: "not-a-real-derivation-mode" as unknown as DerivationMode,
    };
  }

  test("rejected Promise is annotated with status='rejected' once the microtask runs", async () => {
    const account = makeUnsupportedCurrencyAccount("annotation");
    const p = getAccountBridge(account);
    await p.catch(() => {});
    expect((p as unknown as { status?: string }).status).toBe("rejected");
    expect((p as unknown as { reason?: unknown }).reason).toBeInstanceOf(CurrencyNotSupported);
  });

  test("unsupported-derivation rejection is annotated the same way", async () => {
    const account = makeUnsupportedDerivationAccount("annotation-derivation");
    const p = getAccountBridge(account);
    await p.catch(() => {});
    expect((p as unknown as { status?: string }).status).toBe("rejected");
    expect((p as unknown as { reason?: unknown }).reason).toBeInstanceOf(AccountNotSupported);
  });

  test("rejection identity is stable across calls (avoids React.use() loop)", async () => {
    const account = makeUnsupportedCurrencyAccount("identity");
    const p1 = getAccountBridge(account);
    const p2 = getAccountBridge(account);
    p1.catch(() => {});
    expect(p1).toBe(p2);
    await expect(p1).rejects.toBeInstanceOf(CurrencyNotSupported);
  });

  test("clearBridgeCache invalidates so a re-supported currency can resolve", async () => {
    const account = makeUnsupportedCurrencyAccount("dynamic-resupport");
    const p1 = getAccountBridge(account);
    p1.catch(() => {});
    await expect(p1).rejects.toBeInstanceOf(CurrencyNotSupported);

    registerCoinModules(loadersFor("tron"));
    clearBridgeCache();
    try {
      const p2 = getAccountBridge(account);
      await expect(p2).resolves.toBeDefined();
    } finally {
      registerWithoutTron();
    }
  });

  test("clearBridgeCache(family) evicts the cached rejection for that family", async () => {
    const account = makeUnsupportedCurrencyAccount("family-targeted-eviction", "celo");
    const p1 = getAccountBridge(account);
    p1.catch(() => {});
    await expect(p1).rejects.toBeInstanceOf(CurrencyNotSupported);

    registerCoinModules(loadersFor("celo"));
    clearBridgeCache("celo");
    try {
      const p2 = getAccountBridge(account);
      await expect(p2).resolves.toBeDefined();
    } finally {
      registerWithoutTron();
    }
  });

  test("success path identity is preserved (family cache regression guard)", () => {
    const account = genAccount("supported-identity", { currency: BTC });
    const p1 = getAccountBridge(account);
    const p2 = getAccountBridge(account);
    expect(p1).toBe(p2);
  });
});
