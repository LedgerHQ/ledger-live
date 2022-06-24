import "../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw } from "../../account";
import { getAccountCurrency } from "../../account/helpers";
import type { Account, SubAccount } from "../../types";
import { getAccountBridge } from "../../bridge";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { ethereum1 } from "./datasets/ethereum1";

describe("blacklistedTokenIds functionality", () => {
  const account = fromAccountRaw(ethereum1);
  const localCache = {};
  const cache = makeBridgeCacheSystem({
    saveData(c, d) {
      localCache[c.id] = d;
      return Promise.resolve();
    },

    getData(c) {
      return Promise.resolve(localCache[c.id]);
    },
  });
  test("initial raw account contains no token accounts", async () => {
    await cache.prepareCurrency(account.currency);
    expect(ethereum1.subAccounts?.length).toBeFalsy();
  });
  test("sync finds tokens, but not blacklisted ones", async () => {
    const bridge = getAccountBridge(account);
    const blacklistedTokenIds = ["ethereum/erc20/weth"];
    const synced = await bridge
      .sync(account, {
        paginationConfig: {},
        blacklistedTokenIds,
      })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
      .toPromise();
    // Contains token accounts
    expect(synced.subAccounts?.length).toBeTruthy();
    // Contains a known token
    expect(
      (synced.subAccounts as SubAccount[]).find(
        (a) => getAccountCurrency(a)?.id === "ethereum/erc20/0x_project"
      )
    ).toBeTruthy();
    // Does not contain a blacklisted token
    expect(
      (synced.subAccounts as SubAccount[]).find((a) =>
        blacklistedTokenIds.includes(getAccountCurrency(a)?.id)
      )
    ).toBe(undefined);
  });
  test("account resyncs tokens if no longer blacklisted", async () => {
    const bridge = getAccountBridge(account);
    const blacklistedTokenIds = ["ethereum/erc20/weth"];
    const syncedWithoutWeth = await bridge
      .sync(account, {
        paginationConfig: {},
        blacklistedTokenIds,
      })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
      .toPromise();
    // Contains token accounts
    expect(syncedWithoutWeth.subAccounts?.length).toBeTruthy();
    // Does not contain a blacklisted token
    expect(
      (syncedWithoutWeth.subAccounts as SubAccount[]).find((a) =>
        blacklistedTokenIds.includes(getAccountCurrency(a)?.id)
      )
    ).toBe(undefined);
    //Sync again with `syncedWithoutWeth` as a base but without it being blacklisted
    const synced = await bridge
      .sync(account, {
        paginationConfig: {},
        blacklistedTokenIds: ["ethereum/erc20/somethingElse"],
      })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
      .toPromise();
    // Does not contain a blacklisted token
    expect(
      (synced.subAccounts as SubAccount[]).find(
        (a) => getAccountCurrency(a)?.id === "ethereum/erc20/weth"
      )
    ).toBeTruthy();
  });
});
