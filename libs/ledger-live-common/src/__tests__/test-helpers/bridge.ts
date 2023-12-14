import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { reduce, filter, map, delay } from "rxjs/operators";
import flatMap from "lodash/flatMap";
import omit from "lodash/omit";
import { InvalidAddress, RecipientRequired, AmountRequired } from "@ledgerhq/errors";
import {
  fromAccountRaw,
  toAccountRaw,
  decodeAccountId,
  encodeAccountId,
  flattenAccounts,
  isAccountBalanceUnconfirmed,
} from "../../account";
import { getCryptoCurrencyById } from "../../currencies";
import { getOperationAmountNumber } from "../../operation";
import { fromTransactionRaw, toTransactionRaw, toTransactionStatusRaw } from "../../transaction";
import { getAccountBridge, getCurrencyBridge } from "../../bridge";
import { mockDeviceWithAPDUs, releaseMockDevice } from "./mockDevice";
import { implicitMigration } from "../../migrations/accounts";
import type {
  Account,
  AccountBridge,
  AccountLike,
  AccountRawLike,
  SubAccount,
  SyncConfig,
  DatasetTest,
  CurrenciesData,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { firstValueFrom } from "rxjs";
const { createHash } = require("crypto");
const fs = require("fs");
const nock = require("nock");

import { EntryType, PerformanceObserver, PerformanceObserverCallback } from "node:perf_hooks";
import { createMock, initBackendMocks, StdRequest } from "./bridgeMocker";

const useBackendMocks = true;

const requests: any = [];

function reqToStdRequest(nodeRequest: any, nodeResponse: any): StdRequest {
  return {
    method: nodeRequest.method,
    url: nodeRequest.url,
    headers: nodeRequest.headers,
    body: nodeRequest.body || {},
    fileName: sha256(`${nodeRequest.method}${nodeRequest.url}`),
    response: nodeResponse,
  };
}

function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}

const onPerformanceEntry: PerformanceObserverCallback = (items, _observer) => {
  const entries = items.getEntries();
  for (const entry of entries) {
    if (entry.entryType === "http") {
      const req = (entry as any).detail?.req;
      const res = (entry as any).detail?.res;
      if (res && req) {
        if (req.url !== "http://localhost/apdu") {
          console.log(entry.toJSON());
          requests.push(reqToStdRequest(req, res));
        }
      }
    }
  }
};

const warnDev = process.env.CI ? (..._args) => {} : (...msg) => console.warn(...msg);
// FIXME move out into DatasetTest to be defined in
const blacklistOpsSumEq = {
  currencies: ["ripple", "ethereum"],
  impls: ["mock"],
};

function expectBalanceIsOpsSum(a) {
  expect(a.balance).toEqual(
    a.operations.reduce((sum, op) => sum.plus(getOperationAmountNumber(op)), new BigNumber(0)),
  );
}

const defaultSyncConfig = {
  paginationConfig: {},
  blacklistedTokenIds: ["ethereum/erc20/ampleforth", "ethereum/erc20/steth"],
};
export function syncAccount<T extends TransactionCommon>(
  bridge: AccountBridge<T>,
  account: Account,
  syncConfig: SyncConfig = defaultSyncConfig,
): Promise<Account> {
  if (useBackendMocks) {
    //initBackendMocks();
  }

  delay(5000);

  const promise = initBackendMocks().then(() =>
    firstValueFrom(
      bridge
        .sync(account, syncConfig)
        .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account)),
    ),
  );
  if (useBackendMocks) {
    // nock.disableNetConnect();
    promise.finally(() => {
      console.log(nock.activeMocks());
    });
  }

  if (!useBackendMocks) {
    const performanceObserver = new PerformanceObserver(onPerformanceEntry);
    performanceObserver.observe({ entryTypes: ["http", "http2"] });
    promise.finally(() => {
      performanceObserver.disconnect();
      for (const request of requests) {
        const dir =
          __dirname + "/bridgeMocks/" + account.currency.family + "/" + account.currency.id;
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        createMock(request, `${dir}/${request.fileName}.json`).then(() => {});
        // fs.writeFileSync(dir + "/" + request.fileName + ".json", JSON.stringify(request));
      }
    });
  }
  return promise;
}

export function testBridge<T extends TransactionCommon>(data: DatasetTest<T>): void {
  // covers all bridges through many different accounts
  // to test the common shared properties of bridges.
  const accountsRelated: Array<{
    account: Account;
    currencyData: CurrenciesData<T>;
    accountData: any;
    impl: string;
  }> = [];
  const currenciesRelated: Array<{
    currencyData: CurrenciesData<T>;
    currency: CryptoCurrency;
  }> = [];
  const { implementations, currencies } = data;
  Object.keys(currencies).forEach(currencyId => {
    const currencyData = currencies[currencyId];
    const currency = getCryptoCurrencyById(currencyId);
    currenciesRelated.push({
      currencyData,
      currency,
    });

    const accounts = currencyData.accounts || [];
    accounts.forEach(accountData =>
      implementations.forEach(impl => {
        if (accountData.implementations && !accountData.implementations.includes(impl)) {
          return;
        }

        const account = fromAccountRaw({
          ...accountData.raw,
          id: encodeAccountId({
            ...decodeAccountId(accountData.raw.id),
            type: impl,
          }),
        });
        accountsRelated.push({
          currencyData,
          accountData,
          account,
          impl,
        });
      }),
    );
  });
  const accountsFoundInScanAccountsMap = {};

  currenciesRelated.map(({ currencyData, currency }) => {
    const bridge = getCurrencyBridge(currency);

    const scanAccounts = async apdus => {
      const deviceId = await mockDeviceWithAPDUs(apdus, currencyData.mockDeviceOptions);
      try {
        const accounts = await firstValueFrom(
          bridge
            .scanAccounts({
              currency,
              deviceId,
              syncConfig: defaultSyncConfig,
            })
            .pipe(
              filter(e => e.type === "discovered"),
              map(e => e.account),
              reduce((all, a) => all.concat(a), [] as Account[]),
            ),
        );
        return implicitMigration(accounts);
      } catch (e: any) {
        console.error(e.message);
        throw e;
      } finally {
        releaseMockDevice(deviceId);
      }
    };

    const scanAccountsCaches = {};

    const scanAccountsCached = apdus =>
      scanAccountsCaches[apdus] || (scanAccountsCaches[apdus] = scanAccounts(apdus));

    describe(currency.id + " currency bridge", () => {
      const {
        scanAccounts,
        FIXME_ignoreAccountFields,
        FIXME_ignoreOperationFields,
        FIXME_ignorePreloadFields,
      } = currencyData;
      test("functions are defined", () => {
        expect(typeof bridge.scanAccounts).toBe("function");
        expect(typeof bridge.preload).toBe("function");
        expect(typeof bridge.hydrate).toBe("function");
      });
      test("preload and rehydrate", async () => {
        const data1 = await bridge.preload(currency);
        const data1filtered = omit(data1, FIXME_ignorePreloadFields || []);

        bridge.hydrate(data1filtered, currency);

        if (data1filtered) {
          const serialized1 = JSON.parse(JSON.stringify(data1filtered));
          bridge.hydrate(serialized1, currency);
          expect(serialized1).toBeDefined();
          const data2 = await bridge.preload(currency);
          const data2filtered = omit(data2, FIXME_ignorePreloadFields || []);

          if (data2filtered) {
            bridge.hydrate(data2filtered, currency);
            expect(data1filtered).toMatchObject(data2filtered);
            const serialized2 = JSON.parse(JSON.stringify(data2filtered));
            expect(serialized1).toMatchObject(serialized2);
            bridge.hydrate(serialized2, currency);
          }
        }
      });

      if (scanAccounts) {
        if (FIXME_ignoreOperationFields && FIXME_ignoreOperationFields.length) {
          warnDev(
            currency.id +
              " is ignoring operation fields: " +
              FIXME_ignoreOperationFields.join(", "),
          );
        }

        if (FIXME_ignoreAccountFields && FIXME_ignoreAccountFields.length) {
          warnDev(
            currency.id + " is ignoring account fields: " + FIXME_ignoreAccountFields.join(", "),
          );
        }

        describe("scanAccounts", () => {
          scanAccounts.forEach(sa => {
            // we start running the scan accounts in parallel!
            test(sa.name, async () => {
              const accounts = await scanAccountsCached(sa.apdus);
              accounts.forEach(a => {
                accountsFoundInScanAccountsMap[a.id] = a;
              });

              if (!sa.unstableAccounts) {
                const raws: AccountRawLike[] = flatMap(accounts, a => {
                  const main = toAccountRaw(a);
                  if (!main.subAccounts) return [main];
                  return [{ ...main, subAccounts: [] }, ...main.subAccounts] as AccountRawLike[];
                });
                const heads = raws.map(a => {
                  const copy = omit(
                    a,
                    [
                      "operations",
                      "lastSyncDate",
                      "creationDate",
                      "blockHeight",
                      "balanceHistory",
                      "balanceHistoryCache",
                    ].concat(FIXME_ignoreAccountFields || []),
                  );
                  return copy;
                });
                const ops = raws.map(({ operations }) =>
                  operations
                    .slice(0)
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map(op => {
                      const copy = omit(op, ["date"].concat(FIXME_ignoreOperationFields || []));
                      return copy;
                    }),
                );
                expect(heads).toMatchSnapshot();
                expect(ops).toMatchSnapshot();
              }

              const testFn = sa.test;

              if (testFn) {
                await testFn(expect, accounts, bridge);
              }
            });
            test("estimateMaxSpendable is between 0 and account balance", async () => {
              const accounts = await scanAccountsCached(sa.apdus);

              for (const account of accounts) {
                const accountBridge = getAccountBridge(account);
                const estimation = await accountBridge.estimateMaxSpendable({
                  account,
                });
                expect(estimation.gte(0)).toBe(true);
                expect(estimation.lte(account.spendableBalance)).toBe(true);

                for (const sub of account.subAccounts || []) {
                  const estimation = await accountBridge.estimateMaxSpendable({
                    parentAccount: account,
                    account: sub,
                  });
                  expect(estimation.gte(0)).toBe(true);
                  expect(estimation.lte(sub.balance)).toBe(true);
                }
              }
            });
            test("no unconfirmed account", async () => {
              const accounts = await scanAccountsCached(sa.apdus);

              for (const account of flattenAccounts(accounts)) {
                expect({
                  id: account.id,
                  unconfirmed: isAccountBalanceUnconfirmed(account),
                }).toEqual({
                  id: account.id,
                  unconfirmed: false,
                });
              }
            });
            test("creationDate is correct", async () => {
              const accounts = await scanAccountsCached(sa.apdus);

              for (const account of flattenAccounts(accounts)) {
                if (account.operations.length) {
                  const op = account.operations[account.operations.length - 1];

                  if (account.creationDate.getTime() > op.date.getTime()) {
                    warnDev(
                      `OP ${
                        op.id
                      } have date=${op.date.toISOString()} older than account.creationDate=${account.creationDate.toISOString()}`,
                    );
                  }

                  expect(account.creationDate.getTime()).not.toBeGreaterThan(op.date.getTime());
                }
              }
            });
          });
        });
      }

      const currencyDataTest = currencyData.test;

      if (currencyDataTest) {
        test(currency.id + " specific test", () => currencyDataTest(expect, bridge));
      }
    });
    const accounts = currencyData.accounts || [];

    if (accounts.length) {
      const accountsInScan: string[] = [];
      const accountsNotInScan: string[] = [];
      accounts.forEach(({ raw }) => {
        if (accountsFoundInScanAccountsMap[raw.id]) {
          accountsInScan.push(raw.id);
        } else {
          accountsNotInScan.push(raw.id);
        }
      });

      if (accountsInScan.length === 0) {
        warnDev(
          `/!\\ CURRENCY '${currency.id}' define accounts that are NOT in scanAccounts. please add at least one account that is from scanAccounts. This helps testing scanned accounts are fine and it also help performance.`,
        );
      }

      if (accountsNotInScan.length === 0) {
        warnDev(
          `/!\\ CURRENCY '${currency.id}' define accounts that are ONLY in scanAccounts. please add one account that is NOT from scanAccounts. This helps covering the "recovering from xpub" mecanism.`,
        );
      }
    }
  });

  accountsRelated
    .map(({ account, ...rest }) => {
      const bridge = getAccountBridge(account, null);
      if (!bridge) throw new Error("no bridge for " + account.id);
      let accountSyncedPromise;

      // lazy eval so we don't run this yet
      const getSynced = () =>
        accountSyncedPromise || (accountSyncedPromise = syncAccount(bridge, account));

      return {
        getSynced,
        bridge,
        initialAccount: account,
        ...rest,
      };
    })
    .forEach(arg => {
      const { getSynced, bridge, initialAccount, accountData, impl } = arg;

      const makeTest = (name, fn) => {
        if (accountData.FIXME_tests && accountData.FIXME_tests.some(r => name.match(r))) {
          warnDev("FIXME test was skipped. " + name + " for " + initialAccount.name);
          return;
        }

        test(name, fn);
      };

      describe(impl + " bridge on account " + initialAccount.name, () => {
        describe("sync", () => {
          makeTest("succeed", async () => {
            const account = await getSynced();
            const [account2] = implicitMigration([account]);
            expect(fromAccountRaw(toAccountRaw(account2))).toBeDefined();
          });

          if (impl !== "mock") {
            const accFromScanAccounts = accountsFoundInScanAccountsMap[initialAccount.id];

            if (accFromScanAccounts) {
              makeTest("matches the same account from scanAccounts", async () => {
                const acc = await getSynced();
                expect(acc).toMatchObject(accFromScanAccounts);
              });
            }
          }

          makeTest("bridge ref equality", async () => {
            const account = await getSynced();
            expect(bridge).toBe(getAccountBridge(account, null));
          });
          makeTest("account have no NaN values", async () => {
            const account = await getSynced();
            [account, ...(account.subAccounts || [])].forEach(a => {
              expect(a.balance.isNaN()).toBe(false);
              expect(a.operations.find(op => op.value.isNaN())).toBe(undefined);
              expect(a.operations.find(op => op.fee.isNaN())).toBe(undefined);
            });
          });

          if (
            !blacklistOpsSumEq.currencies.includes(initialAccount.currency.id) &&
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

          makeTest("existing operations object refs are preserved", async () => {
            const account = await getSynced();
            const count = Math.floor(account.operations.length / 2);
            const operations = account.operations.slice(count);
            const copy = {
              ...account,
              operations,
              blockHeight: 0,
            };
            const synced = await syncAccount(bridge, copy);
            expect(synced.operations.length).toBe(account.operations.length);
            // same ops are restored
            expect(synced.operations).toEqual(account.operations);
            if (initialAccount.id.startsWith("ethereumjs")) return; // ethereumjs seems to have a bug on this, we ignore because the impl will be dropped.

            // existing ops are keeping refs
            synced.operations.slice(count).forEach((op, i) => {
              expect(op).toStrictEqual(operations[i]);
            });
          });
          makeTest("pendingOperations are cleaned up", async () => {
            const account = await getSynced();

            if (account.operations.length) {
              const operations = account.operations.slice(1);
              const pendingOperations = [account.operations[0]];
              const copy = {
                ...account,
                operations,
                pendingOperations,
                blockHeight: 0,
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

        describe("createTransaction", () => {
          makeTest("empty transaction is an object with empty recipient and zero amount", () => {
            expect(bridge.createTransaction(initialAccount)).toMatchObject({
              amount: new BigNumber(0),
              recipient: "",
            });
          });
          makeTest("empty transaction is equals to itself", () => {
            expect(bridge.createTransaction(initialAccount)).toEqual(
              bridge.createTransaction(initialAccount),
            );
          });
          makeTest("empty transaction correctly serialize", () => {
            const t = bridge.createTransaction(initialAccount);
            expect(fromTransactionRaw(toTransactionRaw(t))).toEqual(t);
          });
          makeTest("transaction with amount and recipient correctly serialize", async () => {
            const account = await getSynced();
            const t = {
              ...bridge.createTransaction(account),
              amount: new BigNumber(1000),
              recipient: account.freshAddress,
            };
            expect(fromTransactionRaw(toTransactionRaw(t))).toEqual(t);
          });
        });

        describe("updateTransaction", () => {
          // stability: function called twice will return the same object reference
          // (=== convergence so we can stop looping, typically because transaction will be a hook effect dependency of prepareTransaction)
          function expectStability(t, patch) {
            const t2 = bridge.updateTransaction(t, patch);
            const t3 = bridge.updateTransaction(t2, patch);
            expect(t2).toBe(t3);
          }

          makeTest("ref stability on empty transaction", async () => {
            const account = await getSynced();
            const tx = bridge.createTransaction(account);
            expectStability(tx, {});
          });

          makeTest("ref stability on self transaction", async () => {
            const account = await getSynced();
            const tx = bridge.createTransaction(account);
            expectStability(tx, {
              amount: new BigNumber(1000),
              recipient: account.freshAddress,
            });
          });
        });

        describe("prepareTransaction", () => {
          // stability: function called twice will return the same object reference
          // (=== convergence so we can stop looping, typically because transaction will be a hook effect dependency of prepareTransaction)
          async function expectStability(account, t) {
            let t2 = await bridge.prepareTransaction(account, t);
            let t3 = await bridge.prepareTransaction(account, t2);
            t2 = omit(t2, arg.currencyData.IgnorePrepareTransactionFields || []);
            t3 = omit(t3, arg.currencyData.IgnorePrepareTransactionFields || []);
            expect(t2).toStrictEqual(t3);
          }

          makeTest("ref stability on empty transaction", async () => {
            const account = await getSynced();
            await expectStability(account, bridge.createTransaction(account));
          });
          makeTest("ref stability on self transaction", async () => {
            const account = await getSynced();
            await expectStability(account, {
              ...bridge.createTransaction(account),
              amount: new BigNumber(1000),
              recipient: account.freshAddress,
            });
          });
          makeTest("can be run in parallel and all yield same results", async () => {
            const account = await getSynced();
            const t = {
              ...bridge.createTransaction(account),
              amount: new BigNumber(1000),
              recipient: account.freshAddress,
            };
            const stable = await bridge.prepareTransaction(account, t);
            const first = omit(
              await bridge.prepareTransaction(account, stable),
              arg.currencyData.IgnorePrepareTransactionFields || [],
            );
            const concur = await Promise.all(
              Array(3)
                .fill(null)
                .map(() => bridge.prepareTransaction(account, stable)),
            );
            concur.forEach(r => {
              r = omit(r, arg.currencyData.IgnorePrepareTransactionFields || []);
              expect(r).toEqual(first);
            });
          });
        });

        describe("getTransactionStatus", () => {
          makeTest("can be called on an empty transaction", async () => {
            const account = await getSynced();
            const t = {
              ...bridge.createTransaction(account),
              feePerByte: new BigNumber(0.0001),
            };
            const s = await bridge.getTransactionStatus(account, t);
            expect(s).toBeDefined();
            expect(s.errors).toHaveProperty("recipient");
            expect(s).toHaveProperty("totalSpent");
            expect(s.totalSpent).toBeInstanceOf(BigNumber);
            expect(s).toHaveProperty("estimatedFees");
            expect(s.estimatedFees).toBeInstanceOf(BigNumber);
            expect(s).toHaveProperty("amount");
            expect(s.amount).toBeInstanceOf(BigNumber);
            expect(s.amount).toEqual(new BigNumber(0));
          });
          makeTest("can be called on an empty prepared transaction", async () => {
            const account = await getSynced();
            const t = await bridge.prepareTransaction(account, {
              ...bridge.createTransaction(account),
              feePerByte: new BigNumber(0.0001),
            });
            const s = await bridge.getTransactionStatus(account, t);
            expect(s).toBeDefined(); // FIXME i'm not sure if we can establish more shared properties
          });
          makeTest("Default empty recipient have a recipientError", async () => {
            const account = await getSynced();
            const t = {
              ...bridge.createTransaction(account),
              feePerByte: new BigNumber(0.0001),
            };
            const status = await bridge.getTransactionStatus(account, t);
            expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
          });
          makeTest("invalid recipient have a recipientError", async () => {
            const account = await getSynced();
            const t = {
              ...bridge.createTransaction(account),
              feePerByte: new BigNumber(0.0001),
              recipient: "invalidADDRESS",
            };
            const status = await bridge.getTransactionStatus(account, t);
            expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
          });
          makeTest("Default empty amount has an amount error", async () => {
            const account = await getSynced();
            const t = await bridge.prepareTransaction(account, {
              ...bridge.createTransaction(account),
              feePerByte: new BigNumber(0.0001),
            });
            const status = await bridge.getTransactionStatus(account, t);
            expect(status.errors.amount).toBeInstanceOf(AmountRequired);
          });

          const accountDataTest = accountData.test;

          if (accountDataTest) {
            makeTest("account specific test", async () =>
              accountDataTest(expect, await getSynced(), bridge),
            );
          }

          (accountData.transactions || []).forEach(
            ({ name, transaction, expectedStatus, apdus, testSignedOperation, test: testFn }) => {
              makeTest("transaction " + name, async () => {
                const account: Account = await getSynced();
                let t =
                  typeof transaction === "function"
                    ? transaction(bridge.createTransaction(account), account, bridge)
                    : transaction;
                t = await bridge.prepareTransaction(account, {
                  feePerByte: new BigNumber(0.0001),
                  ...t,
                });
                const s = await bridge.getTransactionStatus(account, t);

                if (expectedStatus) {
                  const es =
                    typeof expectedStatus === "function"
                      ? expectedStatus(account, t, s)
                      : expectedStatus;
                  const { errors, warnings } = es;

                  // we match errors and warnings
                  errors && expect(s.errors).toMatchObject(errors);
                  warnings && expect(s.warnings).toMatchObject(warnings);
                  // now we match rest of fields but using the raw version for better readability
                  const restRaw: Record<string, any> = toTransactionStatusRaw(
                    {
                      ...s,
                      ...es,
                    },
                    account.currency.family,
                  );
                  delete restRaw.errors;
                  delete restRaw.warnings;

                  for (const k in restRaw) {
                    if (!(k in es)) {
                      delete restRaw[k];
                    }
                  }

                  expect(
                    toTransactionStatusRaw(s as TransactionStatusCommon, account.currency.family),
                  ).toMatchObject(restRaw);
                }

                if (testFn) {
                  await testFn(expect, t, s, bridge);
                }

                if (Object.keys(s.errors).length === 0) {
                  const { subAccountId } = t;
                  const { subAccounts } = account;

                  const inferSubAccount = () => {
                    invariant(subAccounts, "sub accounts available");
                    const a = (subAccounts as SubAccount[]).find(a => a.id === subAccountId);
                    invariant(a, "sub account not found");
                    return a;
                  };

                  const obj = subAccountId
                    ? {
                        transaction: t as TransactionCommon,
                        account: inferSubAccount() as AccountLike,
                        parentAccount: account,
                      }
                    : {
                        transaction: t as TransactionCommon,
                        account: account as AccountLike,
                      };

                  if (
                    (typeof t.mode !== "string" || t.mode === "send") &&
                    t.model &&
                    t.model.kind !== "stake.createAccount"
                  ) {
                    const estimation = await bridge.estimateMaxSpendable(obj);
                    expect(estimation.gte(0)).toBe(true);
                    expect(estimation.lte(obj.account.balance)).toBe(true);

                    if (t.useAllAmount) {
                      expect(estimation.toString()).toBe(s.amount.toString());
                    }
                  }
                }

                if (apdus && impl !== "mock") {
                  const deviceId = await mockDeviceWithAPDUs(apdus);

                  try {
                    const signedOperation = await firstValueFrom(
                      bridge
                        .signOperation({
                          account,
                          deviceId,
                          transaction: t,
                        })
                        .pipe(
                          filter(e => e.type === "signed"),
                          map((e: any) => e.signedOperation),
                        ),
                    );

                    if (testSignedOperation) {
                      await testSignedOperation(expect, signedOperation, account, t, s, bridge);
                    }
                  } finally {
                    releaseMockDevice(deviceId);
                  }
                }
              });
            },
          );
        });
        describe("signOperation and broadcast", () => {
          makeTest("method is available on bridge", async () => {
            expect(typeof bridge.signOperation).toBe("function");
            expect(typeof bridge.broadcast).toBe("function");
          }); // NB for now we are not going farther because most is covered by bash tests
        });
      });
    });
}
