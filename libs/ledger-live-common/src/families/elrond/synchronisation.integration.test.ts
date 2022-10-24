import "../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw } from "../../account";
import { getAccountCurrency } from "../../account/helpers";
import type { Account, SubAccount } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../bridge";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { elrond1 } from "./datasets/elrond1";

describe("ESDT tokens sync functionality", () => {
  const account = fromAccountRaw(elrond1);
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
    expect(elrond1.subAccounts?.length).toBeFalsy();
  });
  test("sync finds tokens", async () => {
    const bridge = getAccountBridge(account);
    const synced = await bridge
      .sync(account, {
        paginationConfig: {},
      })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
      .toPromise();
    // Contains token accounts
    expect(synced.subAccounts?.length).toBeTruthy();
    // Contains a known token
    expect(
      (synced.subAccounts as SubAccount[]).find(
        (a) => getAccountCurrency(a)?.id === "elrond/esdt/4d45582d343535633537"
      )
    ).toBeTruthy();
  });
});
