// @flow

import { BigNumber } from "bignumber.js";
import { Observable, defer, from } from "rxjs";
import { reduce, filter, map } from "rxjs/operators";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/errors";
import type {
  CryptoCurrencyIds,
  Account,
  AccountRaw,
  Transaction,
  TransactionStatus,
  AccountBridge,
  CurrencyBridge,
  SignedOperation,
  SyncConfig
} from "../../types";
import {
  fromAccountRaw,
  toAccountRaw,
  decodeAccountId,
  encodeAccountId
} from "../../account";
import { getCryptoCurrencyById } from "../../currencies";
import { getOperationAmountNumber } from "../../operation";
import {
  fromTransactionRaw,
  toTransactionRaw,
  toTransactionStatusRaw
} from "../../transaction";
import { getBalanceHistoryJS, getRanges } from "../../portfolio";
import { getAccountBridge, getCurrencyBridge } from "../../bridge";
import { mockDeviceWithAPDUs, releaseMockDevice } from "./mockDevice";

type ExpectFn = Function;

export type CurrenciesData<T: Transaction> = {|
  scanAccounts?: Array<{|
    name: string,
    apdus: string,
    accountsSnapshot: AccountRaw[],
    test?: (
      expect: ExpectFn,
      scanned: Account[],
      snapshot: AccountRaw[],
      bridge: CurrencyBridge
    ) => any
  |}>,
  accounts?: Array<{|
    implementations?: string[],
    raw: AccountRaw,
    FIXME_tests?: Array<string | RegExp>,
    transactions?: Array<{|
      name: string,
      transaction: T | ((T, Account, AccountBridge<T>) => T),
      expectedStatus?:
        | $Shape<TransactionStatus>
        | ((Account, T, TransactionStatus) => $Shape<TransactionStatus>),
      test?: (ExpectFn, T, TransactionStatus, AccountBridge<T>) => any,
      apdus?: string,
      testSignedOperation?: (
        ExpectFn,
        SignedOperation,
        Account,
        T,
        TransactionStatus,
        AccountBridge<T>
      ) => any
    |}>,
    test?: (ExpectFn, Account, AccountBridge<T>) => any
  |}>,
  test?: (ExpectFn, CurrencyBridge) => any
|};

export type DatasetTest<T> = {|
  implementations: string[],
  currencies: {
    [_: CryptoCurrencyIds]: CurrenciesData<T>
  }
|};

// FIXME move out into DatasetTest to be defined in
const blacklistOpsSumEq = {
  currencies: ["ripple", "ethereum"],
  impls: ["mock"]
};

function expectBalanceIsOpsSum(a) {
  expect(a.balance).toEqual(
    a.operations.reduce(
      (sum, op) => sum.plus(getOperationAmountNumber(op)),
      BigNumber(0)
    )
  );
}

export function syncAccount<T: Transaction>(
  bridge: AccountBridge<T>,
  account: Account,
  syncConfig: SyncConfig = { paginationConfig: {} }
): Promise<Account> {
  return bridge
    .sync(account, syncConfig)
    .pipe(reduce((a, f: Account => Account) => f(a), account))
    .toPromise();
}

// $FlowFixMe parametric type issue
export function testBridge<T>(family: string, data: DatasetTest<T>) {
  // covers all bridges through many different accounts
  // to test the common shared properties of bridges.
  const accountsRelated = [];
  const currenciesRelated = [];

  const { implementations, currencies } = data;
  Object.keys(currencies).forEach(currencyId => {
    const currencyData = currencies[currencyId];
    const currency = getCryptoCurrencyById(currencyId);

    currenciesRelated.push({
      currencyData,
      currency
    });

    (currencyData.accounts || []).forEach(accountData =>
      implementations.forEach(impl => {
        if (
          accountData.implementations &&
          !accountData.implementations.includes(impl)
        ) {
          return;
        }
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

  const accountsFoundInScanAccountsMap = {};
  const preloadObservables: Array<Observable<any>> = [];

  currenciesRelated.map(({ currencyData, currency }) => {
    const bridge = getCurrencyBridge(currency);

    const scanAccounts = async apdus => {
      const deviceId = mockDeviceWithAPDUs(apdus);
      try {
        const accounts = await bridge
          .scanAccounts({
            currency,
            deviceId,
            syncConfig: {
              paginationConfig: {}
            }
          })
          .pipe(
            filter(e => e.type === "discovered"),
            map(e => e.account),
            reduce((all, a) => all.concat(a), [])
          )
          .toPromise();

        return accounts;
      } finally {
        releaseMockDevice(deviceId);
      }
    };

    let scanAccountsCaches = {};
    const scanAccountsCached = apdus =>
      scanAccountsCaches[apdus] ||
      (scanAccountsCaches[apdus] = scanAccounts(apdus));

    describe(currency.id + " currency bridge", () => {
      const { scanAccounts } = currencyData;
      if (scanAccounts) {
        describe("scanAccounts", () => {
          scanAccounts.forEach(sa => {
            // we start running the scan accounts in parallel!
            preloadObservables.push(
              defer(() =>
                from(
                  scanAccountsCached(sa.apdus).then(
                    () => null,
                    () => {}
                  )
                )
              )
            );

            test(sa.name, async () => {
              const accounts = await scanAccountsCached(sa.apdus);

              accounts.forEach(a => {
                accountsFoundInScanAccountsMap[a.id] = a;
              });

              expect(accounts.map(a => toAccountRaw(a))).toMatchObject(
                sa.accountsSnapshot.map(a => {
                  const copy: Object = { ...a };
                  delete copy.operations;
                  delete copy.lastSyncDate;
                  delete copy.blockHeight;
                  delete copy.balanceHistory;
                  return copy;
                })
              );

              expect(
                accounts.map(a =>
                  toAccountRaw(a)
                    .operations.slice(0)
                    .sort((a, b) => a.id.localeCompare(b.id))
                )
              ).toMatchObject(
                sa.accountsSnapshot.map(a =>
                  a.operations
                    .slice(0)
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map(op => {
                      const copy: Object = { ...op };
                      delete copy.date;
                      return copy;
                    })
                )
              );

              const testFn = sa.test;
              if (testFn) {
                await testFn(expect, accounts, sa.accountsSnapshot, bridge);
              }
            });
          });
        });
      }

      test("functions are defined", () => {
        expect(typeof bridge.scanAccounts).toBe("function");
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
      const {
        getSynced,
        bridge,
        initialAccount,
        accountData,
        impl,
        currencyData
      } = arg;

      const makeTest = (name, fn) => {
        if (
          accountData.FIXME_tests &&
          accountData.FIXME_tests.some(r => name.match(r))
        ) {
          console.warn(
            "FIXME test was skipped. " + name + " for " + initialAccount.name
          );
          return;
        }
        test(name, fn);
      };

      describe(impl + " bridge on account " + initialAccount.name, () => {
        describe("sync", () => {
          makeTest("succeed", async () => {
            const account = await getSynced();
            expect(fromAccountRaw(toAccountRaw(account))).toBeDefined();
          });

          if (impl !== "mock") {
            const accFromScanAccounts =
              accountsFoundInScanAccountsMap[initialAccount.id];
            if (accFromScanAccounts) {
              makeTest(
                "matches the same account from scanAccounts",
                async () => {
                  const acc = await getSynced();
                  expect(acc).toMatchObject(accFromScanAccounts);
                }
              );
            } else {
              console.warn(
                initialAccount.id +
                  " is NOT present in scanAccounts tests. " +
                  (currencyData.scanAccounts
                    ? "scanAccounts tests should covers the same accounts & same account ids were used. "
                    : "") +
                  "ProTip: with the same seed and a fresh db, `ledger-live generateTestScanAccounts -c " +
                  initialAccount.currency.id +
                  "`"
              );
            }
          }

          makeTest("bridge ref equality", async () => {
            const account = await getSynced();
            expect(bridge).toBe(getAccountBridge(account, null));
          });

          if (
            !blacklistOpsSumEq.currencies.includes(
              initialAccount.currency.id
            ) &&
            !blacklistOpsSumEq.impls.includes(impl)
          ) {
            makeTest("balance is sum of ops", async () => {
              const account = await getSynced();
              expectBalanceIsOpsSum(account);
              if (account.subAccounts) {
                account.subAccounts.forEach(expectBalanceIsOpsSum);
              }
            });

            makeTest("balance and spendableBalance boundaries", async () => {
              const account = await getSynced();
              expect(account.balance).toBeInstanceOf(BigNumber);
              expect(account.spendableBalance).toBeInstanceOf(BigNumber);
              expect(account.balance.lt(0)).toBe(false);
              expect(account.spendableBalance.lt(0)).toBe(false);
              expect(account.spendableBalance.lte(account.balance)).toBe(true);
            });
          }

          makeTest(
            "existing operations object refs are preserved",
            async () => {
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
            }
          );

          makeTest("pendingOperations are cleaned up", async () => {
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

          makeTest("there are no Operation dups (by id)", async () => {
            const account = await getSynced();
            const seen = {};
            account.operations.forEach(op => {
              expect(seen[op.id]).toBeUndefined();
              seen[op.id] = op.id;
            });
          });
        });

        makeTest(
          "account balanceHistory (when exists) matches getBalanceHistoryJS",
          async () => {
            const account = await getSynced();
            getRanges().forEach(range => {
              const balanceHistory =
                account.balanceHistory && account.balanceHistory[range];
              if (!balanceHistory) return;
              const history = getBalanceHistoryJS(account, range);
              expect(balanceHistory.map(b => b.value)).toEqual(
                history.map(b => b.value)
              );
            });
          }
        );

        describe("createTransaction", () => {
          makeTest(
            "empty transaction is an object with empty recipient and zero amount",
            () => {
              expect(bridge.createTransaction(initialAccount)).toMatchObject({
                amount: BigNumber(0),
                recipient: ""
              });
            }
          );

          makeTest("empty transaction is equals to itself", () => {
            expect(bridge.createTransaction(initialAccount)).toEqual(
              bridge.createTransaction(initialAccount)
            );
          });

          makeTest("empty transaction correctly serialize", () => {
            const t = bridge.createTransaction(initialAccount);
            expect(fromTransactionRaw(toTransactionRaw(t))).toEqual(t);
          });

          makeTest(
            "transaction with amount and recipient correctly serialize",
            async () => {
              const account = await getSynced();
              const t = {
                ...bridge.createTransaction(account),
                amount: BigNumber(1000),
                recipient: account.freshAddress
              };
              expect(fromTransactionRaw(toTransactionRaw(t))).toEqual(t);
            }
          );
        });

        describe("prepareTransaction", () => {
          // stability: function called twice will return the same object reference (=== convergence so we can stop looping, typically because transaction will be a hook effect dependency of prepareTransaction)
          async function expectStability(account, t) {
            const t2 = await bridge.prepareTransaction(account, t);
            const t3 = await bridge.prepareTransaction(account, t2);
            expect(t2).toBe(t3);
          }

          makeTest("ref stability on empty transaction", async () => {
            const account = await getSynced();
            await expectStability(account, bridge.createTransaction(account));
          });

          makeTest("ref stability on self transaction", async () => {
            const account = await getSynced();
            await expectStability(account, {
              ...bridge.createTransaction(account),
              amount: BigNumber(1000),
              recipient: account.freshAddress
            });
          });

          makeTest(
            "can be run in parallel and all yield same results",
            async () => {
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
            }
          );
        });

        describe("getTransactionStatus", () => {
          makeTest("can be called on an empty transaction", async () => {
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

          makeTest(
            "can be called on an empty prepared transaction",
            async () => {
              const account = await getSynced();
              const t = await bridge.prepareTransaction(
                account,
                bridge.createTransaction(account)
              );
              expect(t.networkInfo).toBeDefined();
              const s = await bridge.getTransactionStatus(account, t);
              expect(s).toBeDefined();
              // FIXME i'm not sure if we can establish more shared properties
            }
          );

          makeTest(
            "Default empty recipient have a recipientError",
            async () => {
              const account = await getSynced();
              let t = {
                ...bridge.createTransaction(account)
              };
              let status = await bridge.getTransactionStatus(account, t);
              expect(status.errors.recipient).toEqual(new RecipientRequired());
            }
          );

          makeTest("invalid recipient have a recipientError", async () => {
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
            makeTest("account specific test", async () =>
              accountDataTest(expect, await getSynced(), bridge)
            );
          }

          (accountData.transactions || []).forEach(
            ({
              name,
              transaction,
              expectedStatus,
              apdus,
              testSignedOperation,
              test: testFn
            }) => {
              makeTest("transaction " + name, async () => {
                const account = await getSynced();
                let t =
                  typeof transaction === "function"
                    ? // $FlowFixMe
                      transaction(
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
                  const { errors, warnings } = es;
                  // we match errors and warnings
                  if (errors) {
                    expect(s.errors).toMatchObject(errors);
                  }
                  if (warnings) {
                    expect(s.warnings).toMatchObject(warnings);
                  }
                  // now we match rest of fields but using the raw version for better readability
                  const restRaw: Object = toTransactionStatusRaw({
                    ...s,
                    ...es
                  });
                  delete restRaw.errors;
                  delete restRaw.warnings;
                  for (let k in restRaw) {
                    if (!(k in es)) {
                      delete restRaw[k];
                    }
                  }
                  expect(toTransactionStatusRaw(s)).toMatchObject(restRaw);
                }
                if (testFn) {
                  await testFn(expect, t, s, bridge);
                }

                if (apdus && impl !== "mock") {
                  const deviceId = mockDeviceWithAPDUs(apdus);
                  try {
                    const signedOperation = await bridge
                      .signOperation({
                        account,
                        deviceId,
                        transaction: t
                      })
                      .pipe(
                        filter(e => e.type === "signed"),
                        map(e => e.signedOperation)
                      )
                      .toPromise();

                    if (testSignedOperation) {
                      await testSignedOperation(
                        expect,
                        signedOperation,
                        account,
                        t,
                        s,
                        bridge
                      );
                    }
                  } finally {
                    releaseMockDevice(deviceId);
                  }
                }
              });
            }
          );
        });

        describe("signOperation and broadcast", () => {
          makeTest("method is available on bridge", async () => {
            expect(typeof bridge.signOperation).toBe("function");
            expect(typeof bridge.broadcast).toBe("function");
          });

          // NB for now we are not going farther because most is covered by bash tests
        });
      });
    });

  return {
    preloadObservables
  };
}
