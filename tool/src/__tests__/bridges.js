// @flow

import "babel-polyfill";
import { BigNumber } from "bignumber.js";
import { reduce } from "rxjs/operators";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/errors";
import {
  fromAccountRaw,
  toAccountRaw,
  decodeAccountId,
  encodeAccountId
} from "@ledgerhq/live-common/lib/account";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  fromTransactionRaw,
  toTransactionRaw
} from "@ledgerhq/live-common/lib/transaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import dataset from "@ledgerhq/live-common/lib/generated/test-dataset";
import specifics from "@ledgerhq/live-common/lib/generated/test-specifics";
import { setup } from "../live-common-setup-test";

setup("bridges");

function syncAccount(bridge, account) {
  return bridge
    .startSync(account, false)
    .pipe(reduce((a, f) => f(a), account))
    .toPromise();
}

// covers all bridges through many different accounts
// to test the common shared properties of bridges.
const all = [];
Object.keys(dataset).forEach(family => {
  if (process.env.FAMILY && process.env.FAMILY !== family) return;
  const data = dataset[family];
  const { implementations, currencies } = data;
  Object.keys(currencies).forEach(currencyId => {
    const currencyData = currencies[currencyId];
    currencyData.accounts.slice(0, 1).forEach(accountData =>
      implementations.forEach(impl => {
        const account = fromAccountRaw({
          ...accountData.raw,
          id: encodeAccountId({
            ...decodeAccountId(accountData.raw.id),
            type: impl
          })
        });
        all.push({
          currencyData,
          accountData,
          account,
          impl
        });
      })
    );
  });

  return all;
});

all
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

        if (initialAccount.currency.id !== "ripple" && impl !== "mock") {
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
          const first = await bridge.prepareTransaction(account, t);
          const concur = await Promise.all(
            Array(3)
              .fill(null)
              .map(() => bridge.prepareTransaction(account, t))
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

        (accountData.transactions || []).forEach(
          ({ name, transaction, expectedStatus }) => {
            describe("transaction " + name, () => {
              test("matches expected status", async () => {
                const account = await getSynced();
                const t = await bridge.prepareTransaction(account, transaction);
                expect(t.networkInfo).toBeDefined();
                const s = await bridge.getTransactionStatus(account, t);
                expect(s).toMatchObject(expectedStatus);
                /*
                const raw = toTransactionStatusRaw(s);
                expect(raw).toMatchObject({
                  ...raw
                });
                */
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
