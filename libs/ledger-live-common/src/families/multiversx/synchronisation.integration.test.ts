import "../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw, getAccountCurrency } from "../../account";
import type { Account, SubAccount } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../bridge";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { multiversx1 } from "./datasets/multiversx1";
import { firstValueFrom } from "rxjs";

describe("ESDT tokens sync functionality", () => {
  const account = fromAccountRaw(multiversx1);
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
    expect(multiversx1.subAccounts?.length).toBeFalsy();
  });

  test("sync finds tokens", async () => {
    const bridge = getAccountBridge(account);
    const synced = await firstValueFrom(
      bridge
        .sync(account, {
          paginationConfig: {},
        })
        .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account)),
    );
    // Contains token accounts
    expect(synced.subAccounts?.length).toBeTruthy();
    // Contains a known token
    expect(
      (synced.subAccounts as SubAccount[]).find(
        a => getAccountCurrency(a)?.id === "multiversx/esdt/4d45582d343535633537",
      ),
    ).toBeTruthy();
  });
});
