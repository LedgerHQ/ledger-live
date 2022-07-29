import "../../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw } from "../../../account";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../../bridge";
import { makeBridgeCacheSystem } from "../../../bridge/cache";
import { ethereum1 } from "../datasets/ethereum1";
import { setEnv } from "../../../env";
setEnv("COMPOUND_API", "https://status.ledger.com"); // hack to hit an endpoint that actually is going to 404

test("if API is down, an account still sync fine", async () => {
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
  await cache.prepareCurrency(account.currency);
  const bridge = getAccountBridge(account);
  const synced = await bridge
    .sync(account, {
      paginationConfig: {},
      blacklistedTokenIds: [
        "ethereum/erc20/ampleforth",
        "ethereum/erc20/steth",
      ],
    })
    .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
    .toPromise();
  expect(synced).not.toBeFalsy();
});
