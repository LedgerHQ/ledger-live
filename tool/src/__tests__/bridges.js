// @flow


import { BigNumber } from "bignumber.js";
import { reduce } from "rxjs/operators";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/errors";
import {
  fromAccountRaw,
  toAccountRaw,
  decodeAccountId,
  encodeAccountId
} from "@ledgerhq/live-common/lib/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  fromTransactionRaw,
  toTransactionRaw
} from "@ledgerhq/live-common/lib/transaction";
import {
  getAccountBridge,
  getCurrencyBridge
} from "@ledgerhq/live-common/lib/bridge";
import dataset from "@ledgerhq/live-common/lib/generated/test-dataset";
import specifics from "@ledgerhq/live-common/lib/generated/test-specifics";
import { setup } from "../live-common-setup-test";

const blacklistOpsSumEq = {
  currencies: ["ripple", "ethereum"],
  impls: ["mock"]
};

setup("bridges");

function syncAccount(bridge, account) {
  return bridge
    .startSync(account, false)
    .pipe(reduce((a, f) => f(a), account))
    .toPromise();
}

// covers all bridges through many different accounts
// to test the common shared properties of bridges.
const accountsRelated = [];
const currenciesRelated = [];
Object.keys(dataset).forEach(family => {
  if (process.env.FAMILY && process.env.FAMILY !== family) return;
  const data = dataset[family];
  const { implementations, currencies } = data;
  Object.keys(currencies).forEach(currencyId => {
    const currencyData = currencies[currencyId];
    const currency = getCryptoCurrencyById(currencyId);

    implementations.forEach(impl => {
      currenciesRelated.push({
        currencyData,
        currency,
        impl
      });
    });

    currencyData.accounts.forEach(accountData =>
      implementations.forEach(impl => {
        const account = fromAccountRaw({
          ...accountData.raw,
          id: encodeAccountId({
            ...decodeAccountId(accountData.raw.id),
            type: impl
          })
        });
        accountsRelated.push({
          currencyData,
          accountData,
          account,
          impl
        });
      })
    );
  });

  return accountsRelated;
});

currenciesRelated.map(({ currencyData, currency, impl }) => {
  const bridge = getCurrencyBridge(currency);
  describe(impl + " " + currency.id + " currency bridge", () => {
    test("functions are defined", () => {
      expect(typeof bridge.scanAccountsOnDevice).toBe("function");
      expect(typeof bridge.preload).toBe("function");
      expect(typeof bridge.hydrate).toBe("function");
    });

    test("preload and rehydrate", async () => {
      const data1 = await bridge.preload();
      const serialized = JSON.stringify(data1);
      if (data1) {
        expect(serialized).toBeDefined();
        const data2 = await bridge.preload();
        expect(data1).toMatchObject(data2);
        expect(JSON.parse(serialized)).toMatchObject(data2);
        bridge.hydrate(data1);
      }
    });

    const currencyDataTest = currencyData.test;
    if (currencyDataTest) {
      test(currency.id + " specific test", () =>
        currencyDataTest(expect, bridge)
      );
    }
  });
});

accountsRelated
  .map(({ account, ...rest }) => {
    const bridge = getAccountBridge(account, null);
    if (!bridge) throw new Error("no bridge for " + account.id);
    let accountSyncedPromise;
    // lazy eval so we don't run this yet
    const getSynced = () =>
      accountSyncedPromise ||
      (accountSyncedPromise = syncAccount(bridge, account));
    return { getSynced, bridge, initialAccount: account, ...rest };
  })
  .forEach(arg => {
    const { getSynced, bridge, initialAccount, accountData, impl } = arg;

    describe(impl + " bridge on account " + initialAccount.name, () => {
      describe("startSync", () => {
        test("succeed", async () => {
          const account = await getSynced();
          expect(fromAccountRaw(toAccountRaw(account))).toBeDefined();
        });

        test("bridge ref equality", async () => {
          const account = await getSynced();
          expect(bridge).toBe(getAccountBridge(account, null));
        });

        if (
          !blacklistOpsSumEq.currencies.includes(initialAccount.currency.id) &&
          !blacklistOpsSumEq.impls.includes(impl)
        ) {
          function expectBalanceIsOpsSum(a) {
            expect(a.balance).toEqual(
              a.operations.reduce(
                (sum, op) => sum.plus(getOperationAmountNumber(op)),
                BigNumber(0)
              )
            );
          }
          test("balance is sum of ops", async () => {
            const account = await getSynced();
            expectBalanceIsOpsSum(account);
            if (account.subAccounts) {
              account.subAccounts.forEach(expectBalanceIsOpsSum);
            }
          });

          test("balance and spendableBalance boundaries", async () => {
            const account = await getSynced();
            expect(account.balance).toBeInstanceOf(BigNumber);
            expect(account.spendableBalance).toBeInstanceOf(BigNumber);
            expect(account.balance.lt(0)).toBe(false);
            expect(account.spendableBalance.lt(0)).toBe(false);
            expect(account.spendableBalance.lte(account.balance)).toBe(true);
          });
        }

        test("existing operations object refs are preserved", async () => {
          const account = await getSynced();
          const count = Math.floor(account.operations.length / 2);
          const operations = account.operations.slice(count);
          const copy = { ...account, operations, blockHeight: 0 };
          const synced = await syncAccount(bridge, copy);

          expect(synced.operations.length).toBe(account.operations.length);

          // same ops are restored
          expect(synced.operations).toEqual(account.operations);

          if (initialAccount.id.startsWith("ethereumjs")) return; // ethereumjs seems to have a bug on this, we ignore because the impl will be dropped.
          // existing ops are keeping refs
          synced.operations.slice(count).forEach((op, i) => {
            expect(op).toBe(operations[i]);
          });
        });

        test("pendingOperations are cleaned up", async () => {
          const account = await getSynced();
          if (account.operations.length) {
            const operations = account.operations.slice(1);
            const pendingOperations = [account.operations[0]];
            const copy = {
              ...account,
              operations,
              pendingOperations,
              blockHeight: 0
            };
            const synced = await syncAccount(bridge, copy);
            // same ops are restored
            expect(synced.operations).toEqual(account.operations);
            // pendingOperations is empty
            expect(synced.pendingOperations).toEqual([]);
          }
        });

        test("there are no Operation dups (by id)", async () => {
          const account = await getSynced();
          const seen = {};
          account.operations.forEach(op => {
            expect(seen[op.id]).toBeUndefined();
            seen[op.id] = op.id;
          });
        });
      });

      describe("createTransaction", () => {
        test("empty transaction is an object with empty recipient and zero amount", () => {
          expect(bridge.createTransaction(initialAccount)).toMatchObject({
            amount: BigNumber(0),
            recipient: ""
          });
        });

        test("empty transaction is equals to itself", () => {
          expect(bridge.createTransaction(initialAccount)).toEqual(
            bridge.createTransaction(initialAccount)
          );
        });

        test("empty transaction correctly serialize", () => {
          const t = bridge.createTransaction(initialAccount);
          expect(fromTransactionRaw(toTransactionRaw(t))).toEqual(t);
        });

        test("transaction with amount and recipient correctly serialize", async () => {
          const account = await getSynced();
          const t = {
            ...bridge.createTransaction(account),
            amount: BigNumber(1000),
            recipient: account.freshAddress
          };
          expect(fromTransactionRaw(toTransactionRaw(t))).toEqual(t);
        });
      });

      describe("prepareTransaction", () => {
        // stability: function called twice will return the same object reference (=== convergence so we can stop looping, typically because transaction will be a hook effect dependency of prepareTransaction)
        async function expectStability(account, t) {
          const t2 = await bridge.prepareTransaction(account, t);
          const t3 = await bridge.prepareTransaction(account, t2);
          expect(t2).toBe(t3);
        }

        test("ref stability on empty transaction", async () => {
          const account = await getSynced();
          await expectStability(account, bridge.createTransaction(account));
        });

        test("ref stability on self transaction", async () => {
          const account = await getSynced();
          await expectStability(account, {
            ...bridge.createTransaction(account),
            amount: BigNumber(1000),
            recipient: account.freshAddress
          });
        });

        test("can be run in parallel and all yield same results", async () => {
          const account = await getSynced();
          const t = {
            ...bridge.createTransaction(account),
            amount: BigNumber(1000),
            recipient: account.freshAddress
          };
          const stable = await bridge.prepareTransaction(account, t);
          const first = await bridge.prepareTransaction(account, stable);
          const concur = await Promise.all(
            Array(3)
              .fill(null)
              .map(() => bridge.prepareTransaction(account, stable))
          );
          concur.forEach(r => {
            expect(r).toEqual(first);
          });
        });
      });

      describe("getTransactionStatus", () => {
        test("can be called on an empty transaction", async () => {
          const account = await getSynced();
          const t = bridge.createTransaction(account);
          const s = await bridge.getTransactionStatus(account, t);
          expect(s).toBeDefined();
          expect(s.errors).toHaveProperty("recipient");
          expect(s).toHaveProperty("totalSpent");
          expect(s.totalSpent).toBeInstanceOf(BigNumber);
          expect(s).toHaveProperty("estimatedFees");
          expect(s.estimatedFees).toBeInstanceOf(BigNumber);
          expect(s).toHaveProperty("amount");
          expect(s.amount).toBeInstanceOf(BigNumber);
          expect(s.amount).toEqual(BigNumber(0));
        });

        test("can be called on an empty prepared transaction", async () => {
          const account = await getSynced();
          const t = await bridge.prepareTransaction(
            account,
            bridge.createTransaction(account)
          );
          expect(t.networkInfo).toBeDefined();
          const s = await bridge.getTransactionStatus(account, t);
          expect(s).toBeDefined();
          // FIXME i'm not sure if we can establish more shared properties
        });

        test("Default empty recipient have a recipientError", async () => {
          const account = await getSynced();
          let t = {
            ...bridge.createTransaction(account)
          };
          let status = await bridge.getTransactionStatus(account, t);
          expect(status.errors.recipient).toEqual(new RecipientRequired());
        });

        test("invalid recipient have a recipientError", async () => {
          const account = await getSynced();
          let t = {
            ...bridge.createTransaction(account),
            recipient: "invalidADDRESS"
          };
          let status = await bridge.getTransactionStatus(account, t);
          expect(status.errors.recipient).toEqual(new InvalidAddress());
        });

        const accountDataTest = accountData.test;
        if (accountDataTest) {
          test("account specific test", async () =>
            accountDataTest(expect, await getSynced(), bridge));
        }

        (accountData.transactions || []).forEach(
          ({ name, transaction, expectedStatus, test: testFn }) => {
            describe("transaction " + name, () => {
              test("getTransactionStatus", async () => {
                const account = await getSynced();
                let t =
                  typeof transaction === "function"
                    ? transaction(
                        bridge.createTransaction(account),
                        account,
                        bridge
                      )
                    : transaction;
                t = await bridge.prepareTransaction(account, t);
                expect(t.networkInfo).toBeDefined();
                const s = await bridge.getTransactionStatus(account, t);
                if (expectedStatus) {
                  const es =
                    typeof expectedStatus === "function"
                      ? expectedStatus(account, t, s)
                      : expectedStatus;
                  expect(s).toMatchObject(es);
                }
                if (testFn) {
                  await testFn(expect, t, s, bridge);
                }
              });
            });
          }
        );
      });

      describe("signAndBroadcast", () => {
        test("method is available on bridge", async () => {
          expect(typeof bridge.signAndBroadcast).toBe("function");
        });

        // NB for now we are not going farther because most is covered by bash tests
      });
    });
  });

Object.values(specifics).forEach((specific: Function) => {
  specific();
});
