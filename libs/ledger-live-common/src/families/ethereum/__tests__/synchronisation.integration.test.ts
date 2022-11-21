import "../../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw } from "../../../account";
import { getAccountCurrency } from "../../../account/helpers";
import type { Account, SubAccount, OperationRaw } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../../bridge";
import { makeBridgeCacheSystem } from "../../../bridge/cache";
import { ethereum1 } from "../datasets/ethereum1";
import { ethereum2 } from "../datasets/ethereum2";
import { encodeOperationId } from "../../../operation";
import {
  getCryptoCurrencyById,
  listTokensForCryptoCurrency,
} from "@ledgerhq/cryptoassets";

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

describe("sync on reorg", () => {
  test("should sync from scratch if stableoperations latest blockhash is not on chain", async () => {
    const opHash = "NotImportant";
    const accountId = ethereum2.id;
    const opType = "OUT";
    const opId = encodeOperationId(accountId, opHash, opType);
    const blockHeight = 10042069;
    const currency = getCryptoCurrencyById(ethereum2.currencyId);
    const syncHash =
      JSON.stringify([]) +
      "_" +
      listTokensForCryptoCurrency(currency, {
        withDelisted: true,
      }).length;

    const operation: OperationRaw = {
      id: opId,
      hash: opHash,
      type: opType,
      value: "1",
      fee: "string",
      senders: ["0x789d2f10826BF8f3a56Ec524359bBA4e738Af5bF"],
      recipients: ["0xdA9EDcC3CF66bc18050dB55D376407Cf85e0617B"],
      blockHeight: blockHeight - 81, // 80 is defined today as the threshold number of confirmation to be safe for a reorg. @see SAFE_REORG_THRESHOLD
      blockHash:
        "0x00000000000000000000000000000000000Th1sH4shSh0u1dN0t3x1sTOnCh4iN",
      transactionSequenceNumber: 1,
      date: "May-11-2020 01:50:10 UTC",
      extra: {},
      accountId,
    };

    const account = fromAccountRaw({
      ...ethereum2,
      blockHeight,
      syncHash,
      operations: [operation],
      operationsCount: 1,
    });
    const bridge = getAccountBridge(account);
    const syncPromise = await bridge
      .sync(account, {
        paginationConfig: {},
        blacklistedTokenIds: [],
      })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
      .toPromise();
    // expect not to throw ok if you reach this point
    // + expect operations to be from full sync instead of incremental
    // so the fake op should be removed
    expect(syncPromise.operations.map((o) => o.id)).not.toContain(opId);
    // To this date (June 20th 2022) this account has 160 ops, we should at least get them all
    expect(syncPromise.operations.length >= 160).toBe(true);
  });
});
