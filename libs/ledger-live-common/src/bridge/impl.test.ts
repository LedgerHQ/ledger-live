import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import { initialBitcoinResourcesValue } from "@ledgerhq/coin-bitcoin/types";
import type { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import { genAccount } from "../mock/account";
import { setSupportedCurrencies } from "../currencies";
import { getAccountBridge } from ".";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
setSupportedCurrencies(["bitcoin", "ethereum"]);

describe("wrapAccountBridge — extension routing", () => {
  test("bitcoin clearAccount resets bitcoinResources (coin-specific override)", () => {
    const account = genAccount("btc-clear-routing", { currency: BTC }) as BitcoinAccount;
    // Mutate to simulate state that the family-specific clearAccount must wipe.
    account.bitcoinResources = {
      utxos: [{ hash: "deadbeef" } as unknown as BitcoinAccount["bitcoinResources"]["utxos"][0]],
      walletAccount: { foo: "bar" } as unknown as BitcoinAccount["bitcoinResources"]["walletAccount"],
    };
    account.operations = [{ id: "op1" } as unknown as BitcoinAccount["operations"][0]];
    account.blockHeight = 999;

    const bridge = getAccountBridge(account);
    const cleared = bridge.clearAccount(account) as BitcoinAccount;

    expect(cleared.bitcoinResources).toEqual(initialBitcoinResourcesValue);
    expect(cleared.operations).toEqual([]);
    expect(cleared.blockHeight).toBe(0);
  });

  test("clearAccount on a family without override falls back to framework default", () => {
    const account = genAccount("eth-clear-default", { currency: ETH });
    account.operations = [{ id: "op1" } as unknown as (typeof account.operations)[0]];
    account.blockHeight = 42;

    const bridge = getAccountBridge(account);
    const cleared = bridge.clearAccount(account);

    expect(cleared.operations).toEqual([]);
    expect(cleared.blockHeight).toBe(0);
  });

  test("isAccountEmpty default returns true for an empty account", () => {
    const account = genAccount("eth-empty", { currency: ETH });
    account.operations = [];
    account.operationsCount = 0;
    account.balance = new BigNumber(0);
    account.subAccounts = [];

    const bridge = getAccountBridge(account);
    expect(bridge.isAccountEmpty(account)).toBe(true);
  });
});
