// @flow
import "../../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw, toAccountRaw } from "../../../account";
import type { Account } from "../../../types";
import { getAccountBridge } from "../../../bridge";
import { makeBridgeCacheSystem } from "../../../bridge/cache";
import { ethereum1 } from "../test-dataset";
import { setEnv } from "../../../env";

setEnv("COMPOUND_API", "https://status.ledger.com"); // hack to hit an endpoint that actually is going to 404

test("if API is down, an account still sync fine", async () => {
  const account = fromAccountRaw(ethereum1);
  let localCache = {};
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
      blacklistedTokenIds: ["ethereum/erc20/ampleforth"],
    })
    .pipe(reduce((a, f: (Account) => Account) => f(a), account))
    .toPromise();
  const raw = toAccountRaw(synced);
  // empty unstable fields
  raw.blockHeight = 0;
  raw.lastSyncDate = "";
  raw.creationDate = "";
  delete raw.balanceHistoryCache;
  delete raw.syncHash;
  raw.subAccounts = (raw.subAccounts || []).map((a) => {
    delete a.balanceHistoryCache;
    return a;
  });
  raw.operations = raw.operations.map((op) => {
    op.blockHeight = 0;
    op.date = "";
    return op;
  });
  expect(raw).toMatchSnapshot();
});
