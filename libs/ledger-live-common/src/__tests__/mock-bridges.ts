import toPairs from "lodash/toPairs";
import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";
import { reduce, filter, map } from "rxjs/operators";
import "./test-helpers/setup";
import { getAccountBridge, getCurrencyBridge } from "../bridge";
import { setEnv } from "../env";
import { getCryptoCurrencyById } from "../currencies";
import { toAccountRaw, flattenAccounts } from "../account";
import type { Account } from "@ledgerhq/types-live";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
jest.setTimeout(120000);

const mockedCoins: CryptoCurrencyId[] = [
  "bitcoin",
  "zcash",
  "ethereum",
  "ethereum_classic",
  "ripple",
  "tezos",
  "stellar",
  "cosmos",
];

mockedCoins.map(getCryptoCurrencyById).forEach((currency) => {
  describe("mock " + currency.id, () => {
    setEnv("MOCK", true);
    const bridge = getCurrencyBridge(currency);
    setEnv("MOCK", false);
    test("scanAccounts", async () => {
      const accounts = await bridge
        .scanAccounts({
          currency,
          deviceId: "",
          syncConfig: {
            paginationConfig: {},
          },
        })
        .pipe(
          filter((e) => e.type === "discovered"),
          map((e) => e.account),
          reduce((all, a) => all.concat(a), <Account[]>[])
        )
        .toPromise();
      expect(accounts.length).toBeGreaterThan(0);
      const allOps = flatMap(flattenAccounts(accounts), (a) => a.operations);
      const operationIdCollisions = toPairs(groupBy(allOps, "id"))
        .filter(([_, coll]) => coll.length > 1)
        .map(([id]) => id);
      expect(operationIdCollisions).toEqual([]);
      const [first, second] = await Promise.all(
        accounts.map(async (a) => {
          const bridge = getAccountBridge(a, null);
          const synced = await bridge
            .sync(a, {
              paginationConfig: {},
            })
            .pipe(reduce((a, f) => f(a), a))
            .toPromise();
          const m: Record<string, any> = toAccountRaw(a);
          delete m.lastSyncDate;
          delete m.blockHeight;
          expect(toAccountRaw(synced)).toMatchObject(m);
          return synced;
        })
      );

      if (first && second) {
        const bridge = getAccountBridge(first, null);
        let t = bridge.createTransaction(first);
        t = await bridge.prepareTransaction(first, t);
        t = bridge.updateTransaction(t, {
          recipient: second.freshAddress,
          amount: second.balance.div(3),
        });
        t = await bridge.prepareTransaction(first, t);
        const s = await bridge.getTransactionStatus(first, t);
        expect(s).toMatchObject({
          amount: t.amount,
          errors: {},
          warnings: {},
        });
        const signedOperation = await bridge
          .signOperation({
            account: first,
            transaction: t,
            deviceId: "",
          })
          .pipe(
            filter((e) => e.type === "signed"),
            map((e: any) => e.signedOperation)
          )
          .toPromise();
        expect(signedOperation.operation).toBeDefined();
        const operation = await bridge.broadcast({
          account: first,
          signedOperation,
        });
        expect(operation.hash).toBeTruthy();
        const firstResynced = await bridge
          .sync(first, {
            paginationConfig: {},
          })
          .pipe(reduce((a, f) => f(a), first))
          .toPromise();
        expect(firstResynced.operations.length).toBeGreaterThan(
          first.operations.length
        );
      }
    });
  });
});
