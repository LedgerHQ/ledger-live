import expect from "expect";
import invariant from "invariant";
import now from "performance-now";
import sample from "lodash/sample";
import { throwError, of, Observable, OperatorFunction } from "rxjs";
import {
  first,
  filter,
  map,
  reduce,
  tap,
  mergeMap,
  timeoutWith,
  distinctUntilChanged,
} from "rxjs/operators";
import { log } from "@ledgerhq/logs";
import { getCurrencyBridge, getAccountBridge } from "../bridge";
import { promiseAllBatched } from "../promise";
import { isAccountEmpty, formatAccount } from "../account";
import { getOperationConfirmationNumber } from "../operation";
import { getEnv } from "../env";
import { delay } from "../promise";
import {
  listAppCandidates,
  createSpeculosDevice,
  releaseSpeculosDevice,
  findAppCandidate,
} from "../load/speculos";
import type { AppCandidate } from "@ledgerhq/coin-framework/bot/types";
import {
  formatReportForConsole,
  formatTime,
  formatAppCandidate,
  formatError,
} from "./formatters";
import type {
  AppSpec,
  MutationSpec,
  SpecReport,
  MutationReport,
  DeviceAction,
  TransactionTestInput,
  TransactionArg,
  TransactionRes,
  TransactionDestinationTestInput,
  DeviceActionEvent,
} from "./types";
import { makeBridgeCacheSystem } from "../bridge/cache";
import { accountDataToAccount, accountToAccountData } from "../cross";
import type {
  Account,
  AccountLike,
  Operation,
  SignedOperation,
  SignOperationEvent,
  TransactionCommon,
} from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../generated/types";
import { botTest } from "@ledgerhq/coin-framework/bot/bot-test-context";
import { retryWithDelay } from "../rxjs/operators/retryWithDelay";

let appCandidates;
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

// simulate the export/inport of an account
async function crossAccount(account: Account): Promise<Account> {
  const a = accountDataToAccount(accountToAccountData(account));
  a.name += " cross";
  const synced = await syncAccount(a);
  return synced;
}

const defaultScanAccountsRetries = 2;
const delayBetweenScanAccountRetries = 5000;

export async function runWithAppSpec<T extends Transaction>(
  spec: AppSpec<T>,
  reportLog: (arg0: string) => void
): Promise<SpecReport<T>> {
  log("engine", `spec ${spec.name}`);
  const seed = getEnv("SEED");
  invariant(seed, "SEED is not set");
  const coinapps = getEnv("COINAPPS");
  invariant(coinapps, "COINAPPS is not set");

  if (!appCandidates) {
    appCandidates = await listAppCandidates(coinapps);
  }

  const mutationReports: MutationReport<T>[] = [];
  const { appQuery, currency, dependency } = spec;
  const appCandidate = findAppCandidate(appCandidates, appQuery);
  if (!appCandidate) {
    console.warn("no app found for " + spec.name);
    console.warn(appQuery);
    console.warn(JSON.stringify(appCandidates, undefined, 2));
  }
  invariant(
    appCandidate,
    "%s: no app found. Are you sure your COINAPPS is up to date?",
    spec.name,
    coinapps
  );
  log(
    "engine",
    `spec ${spec.name} will use ${formatAppCandidate(
      appCandidate as AppCandidate
    )}`
  );
  const deviceParams = {
    ...(appCandidate as AppCandidate),
    appName: spec.currency.managerAppName,
    seed,
    dependency,
    coinapps,
  };
  let device;
  const hintWarnings: string[] = [];
  const appReport: SpecReport<T> = {
    spec,
    hintWarnings,
    skipMutationsTimeoutReached: false,
  };

  // staticly check that all mutations declared a test too (if no generic spec test)
  if (!spec.test) {
    const list = spec.mutations.filter((m) => !m.test);
    if (list.length > 0) {
      hintWarnings.push(
        "mutations should define a test(): " +
          list.map((m) => m.name).join(", ")
      );
    }
  }

  // staticly assess if testDestination is necessary
  const mutationThatProducedDestinationsWithoutTests: MutationSpec<any>[] = [];
  const mutationWithDestinationTestsWithoutDestination: MutationSpec<any>[] =
    [];

  try {
    device = await createSpeculosDevice(deviceParams);
    appReport.appPath = device.appPath;
    const bridge = getCurrencyBridge(currency);
    const syncConfig = {
      paginationConfig: {},
    };
    let t = now();
    const preloadedData = await cache.prepareCurrency(currency);
    const preloadDuration = now() - t;
    appReport.preloadDuration = preloadDuration;
    // Scan all existing accounts
    const beforeScanTime = now();
    t = now();
    let accounts = await bridge
      .scanAccounts({
        currency,
        deviceId: device.id,
        syncConfig,
      })
      .pipe(
        retryWithDelay(
          delayBetweenScanAccountRetries,
          spec.scanAccountsRetries || defaultScanAccountsRetries
        ),
        filter((e) => e.type === "discovered"),
        map((e) => deepFreezeAccount(e.account)),
        reduce<Account, Account[]>((all, a) => all.concat(a), []),
        timeoutWith(
          getEnv("BOT_TIMEOUT_SCAN_ACCOUNTS"),
          throwError(
            new Error("scan accounts timeout for currency " + currency.name)
          )
        )
      )
      .toPromise();
    appReport.scanDuration = now() - beforeScanTime;

    // check if there are more accounts than mutation declared as a hint for the dev
    if (accounts.length <= spec.mutations.length) {
      hintWarnings.push(
        "There are not enough accounts to cover all mutations. Please increase the account target to at least " +
          (spec.mutations.length + 1) +
          " accounts"
      );
    }

    // "Migrate" the FIRST and every {crossAccountFrequency} account to simulate an export/import (same logic as export to mobile) – default to every 10
    // this is made a subset of the accounts to help identify problem that would be specific to the "cross" or not.
    for (
      let i = 0;
      i < accounts.length;
      i += spec.crossAccountFrequency || 10
    ) {
      accounts[i] = await crossAccount(accounts[i]);
    }
    appReport.accountsBefore = accounts;
    if (!spec.allowEmptyAccounts) {
      invariant(
        accounts.length > 0,
        "unexpected empty accounts for " + currency.name
      );
    }
    const preloadStats =
      preloadDuration > 10 ? ` (preload: ${formatTime(preloadDuration)})` : "";
    reportLog(
      `Spec ${spec.name} found ${accounts.length} ${
        currency.name
      } accounts${preloadStats}. Will use ${formatAppCandidate(
        appCandidate as AppCandidate
      )}\n${accounts.map((a) => formatAccount(a, "head")).join("\n")}\n`
    );

    if (accounts.every(isAccountEmpty)) {
      reportLog(
        `This SEED does not have ${
          currency.name
        }. Please send funds to ${accounts
          .map((a) => a.freshAddress)
          .join(" or ")}\n`
      );
      appReport.accountsAfter = accounts;
      return appReport;
    }

    const mutationsStartTime = now();
    const skipMutationsTimeout =
      spec.skipMutationsTimeout || getEnv("BOT_SPEC_DEFAULT_TIMEOUT");
    let mutationsCount = {};
    // we sequentially iterate on the initial account set to perform mutations
    const length = accounts.length;
    const totalTries = spec.multipleRuns || 1;
    // dynamic buffer with ids of accounts that need a resync (between runs)
    let accountIdsNeedResync: string[] = [];

    for (let j = 0; j < totalTries; j++) {
      for (let i = 0; i < length; i++) {
        t = now();
        if (t - mutationsStartTime > skipMutationsTimeout) {
          appReport.skipMutationsTimeoutReached = true;
          break;
        }
        log(
          "engine",
          `spec ${spec.name} sync all accounts (try ${j} run ${i})`
        );

        // resync all accounts that needs to be resynced
        const resynced = await promiseAllBatched(
          getEnv("SYNC_MAX_CONCURRENT"),
          accounts.filter((a) => accountIdsNeedResync.includes(a.id)),
          syncAccount
        );

        accounts = accounts.map((a: Account) => {
          const i = accountIdsNeedResync.indexOf(a.id);
          return i !== -1 ? resynced[i] : a;
        });

        accountIdsNeedResync = [];

        appReport.accountsAfter = accounts;
        const resyncAccountsDuration = now() - t;
        const account = accounts[i];
        const report = await runOnAccount({
          appCandidate,
          spec,
          device,
          account,
          accounts,
          mutationsCount,
          resyncAccountsDuration,
          accountIdsNeedResync,
          preloadedData,
        });
        if (report.finalAccount) {
          // optim: no need to resync if all went well with finalAccount
          const finalAccount: Account = report.finalAccount;
          accountIdsNeedResync = accountIdsNeedResync.filter(
            (id) => id !== finalAccount.id
          );
          accounts = accounts.map((a: Account) =>
            a.id === finalAccount.id ? finalAccount : a
          );
        }
        if (report.finalDestination) {
          // optim: no need to resync if all went well with finalDestination
          const finalDestination: Account = report.finalDestination;
          accountIdsNeedResync = accountIdsNeedResync.filter(
            (id) => id !== finalDestination.id
          );
          accounts = accounts.map((a: Account) =>
            a.id === finalDestination.id ? finalDestination : a
          );
        } else if (report.mutation) {
          const { mutation } = report;
          if (report.destination) {
            if (
              !mutation.testDestination &&
              !mutationThatProducedDestinationsWithoutTests.includes(mutation)
            ) {
              mutationThatProducedDestinationsWithoutTests.push(mutation);
            }
          } else {
            if (
              mutation.testDestination &&
              !mutationWithDestinationTestsWithoutDestination.includes(mutation)
            ) {
              mutationWithDestinationTestsWithoutDestination.push(mutation);
            }
          }
        }
        // eslint-disable-next-line no-console
        console.log(formatReportForConsole(report));
        mutationReports.push(report);
        appReport.mutations = mutationReports;

        if (
          report.error ||
          (report.latestSignOperationEvent &&
            report.latestSignOperationEvent.type ===
              "device-signature-requested")
        ) {
          log(
            "engine",
            `spec ${spec.name} is recreating the device because deviceAction didn't finished`
          );
          await releaseSpeculosDevice(device.id);
          device = await createSpeculosDevice(deviceParams);
        }
      }
      mutationsCount = {};
    }

    if (
      mutationReports.every((r) => !r.mutation) &&
      accounts.some((a) => a.spendableBalance.gt(spec.minViableAmount || 0))
    ) {
      hintWarnings.push(
        "No mutation were found possible. Yet there are funds in the accounts, please investigate."
      );
    }

    if (mutationThatProducedDestinationsWithoutTests.length) {
      hintWarnings.push(
        "mutations should define a testDestination(): " +
          mutationThatProducedDestinationsWithoutTests
            .map((m) => m.name)
            .join(", ")
      );
    }
    if (mutationWithDestinationTestsWithoutDestination.length) {
      hintWarnings.push(
        "mutations should NOT define a testDestination() because there are no 'destination' sibling account found: " +
          mutationWithDestinationTestsWithoutDestination
            .map((m) => m.name)
            .join(", ")
      );
    }

    mutationReports.forEach((m) => {
      m.hintWarnings.forEach((h) => {
        const txt = `mutation ${m.mutation?.name || "?"}: ${h}`;
        if (!hintWarnings.includes(txt)) {
          hintWarnings.push(txt);
        }
      });
    });

    appReport.mutations = mutationReports;
    appReport.accountsAfter = accounts;
  } catch (e: any) {
    if (process.env.CI) console.error(e);
    appReport.fatalError = e;
    log("engine", `spec ${spec.name} failed with ${String(e)}`);
  } finally {
    log("engine", `spec ${spec.name} finished`);
    if (device) await releaseSpeculosDevice(device.id);
  }

  return appReport;
}
export async function runOnAccount<T extends Transaction>({
  appCandidate,
  spec,
  device,
  account,
  accounts,
  accountIdsNeedResync,
  mutationsCount,
  resyncAccountsDuration,
  preloadedData,
}: {
  appCandidate: any;
  spec: AppSpec<T>;
  device: any;
  account: any;
  accounts: any;
  accountIdsNeedResync: string[];
  mutationsCount: Record<string, number>;
  resyncAccountsDuration: number;
  preloadedData: any;
}): Promise<MutationReport<T>> {
  const { mutations } = spec;
  let latestSignOperationEvent;
  const hintWarnings: string[] = [];
  const report: MutationReport<T> = {
    spec,
    appCandidate,
    resyncAccountsDuration,
    hintWarnings,
  };

  try {
    const accountBridge = getAccountBridge(account);
    const accountBeforeTransaction = account;
    report.account = account;
    log("engine", `spec ${spec.name}/${account.name}`);
    const maxSpendable = await accountBridge.estimateMaxSpendable({
      account,
    });
    report.maxSpendable = maxSpendable;
    log(
      "engine",
      `spec ${spec.name}/${
        account.name
      } maxSpendable=${maxSpendable.toString()}`
    );
    const candidates: Array<{
      mutation: MutationSpec<T>;
      tx: T;
      updates: Array<Partial<T> | null | undefined>;
      destination: Account | undefined;
    }> = [];
    const unavailableMutationReasons: Array<{
      mutation: MutationSpec<T>;
      error: Error;
    }> = [];

    for (const mutation of mutations) {
      try {
        const count = mutationsCount[mutation.name] || 0;
        invariant(
          count < (mutation.maxRun || Infinity),
          "maximum mutation run reached (%s)",
          count
        );
        const arg: TransactionArg<T> = {
          appCandidate,
          account,
          bridge: accountBridge,
          siblings: accounts.filter((a) => a !== account),
          maxSpendable,
          preloadedData,
        };
        if (spec.transactionCheck) spec.transactionCheck(arg);
        const r: TransactionRes<T> = mutation.transaction(arg);
        candidates.push({
          mutation,
          tx: r.transaction,
          // $FlowFixMe what the hell
          updates: r.updates,
          destination: r.destination,
        });
      } catch (error: any) {
        if (process.env.CI) console.error(error);
        unavailableMutationReasons.push({
          mutation,
          error,
        });
      }
    }

    const candidate = sample(candidates);

    if (!candidate) {
      // no mutation were suitable
      report.unavailableMutationReasons = unavailableMutationReasons;
      return report;
    }

    // a mutation was chosen
    const { tx, mutation, updates } = candidate;
    report.mutation = mutation;
    report.mutationTime = now();
    // prepare the transaction and ensure it's valid
    let status;
    let errors = [];
    let transaction: T = await accountBridge.prepareTransaction(account, tx);
    deepFreezeTransaction(transaction);

    for (const patch of updates) {
      if (patch) {
        await accountBridge.getTransactionStatus(account, transaction); // result is unused but that would happen in normal flow

        report.transaction = transaction;
        transaction = await accountBridge.updateTransaction(transaction, patch);
        report.transaction = transaction;
        transaction = await accountBridge.prepareTransaction(
          account,
          transaction
        );
        deepFreezeTransaction(transaction);
      }
    }

    report.transaction = transaction;
    const destination =
      candidate.destination ||
      accounts.find((a) => a.freshAddress === transaction.recipient);
    report.destination = destination;
    status = await accountBridge.getTransactionStatus(account, transaction);
    errors = Object.values(status.errors);

    deepFreezeStatus(status);
    report.status = status;
    report.statusTime = now();
    const warnings = Object.values(status.warnings);

    if (mutation.recoverBadTransactionStatus) {
      if (errors.length || warnings.length) {
        // there is something to recover from
        const recovered = mutation.recoverBadTransactionStatus({
          transaction,
          status,
          account,
          bridge: accountBridge,
        });

        if (recovered && recovered !== transaction) {
          deepFreezeTransaction(recovered);
          report.recoveredFromTransactionStatus = {
            transaction,
            status,
          };
          report.transaction = transaction = recovered;
          status = await accountBridge.getTransactionStatus(
            account,
            transaction
          );
          errors = Object.values(status.errors);
          deepFreezeStatus(status);
          report.status = status;
          report.statusTime = now();
        }
      }
    }

    // without recovering mechanism, we simply assume an error is a failure
    if (errors.length) {
      console.warn(status);
      botTest("mutation must not have tx status errors", () => {
        // all mutation must express transaction that are POSSIBLE
        // recoveredFromTransactionStatus can also be used to solve this for tricky cases
        throw errors[0];
      });
    }

    const { expectStatusWarnings } = mutation;
    if (warnings.length || expectStatusWarnings) {
      const expected =
        expectStatusWarnings &&
        expectStatusWarnings({
          transaction,
          status,
          account,
          bridge: accountBridge,
        });
      if (expected) {
        botTest("verify status.warnings expectations", () =>
          expect(status.warnings).toEqual(expected)
        );
      } else {
        for (const k in status.warnings) {
          const e = status.warnings[k];
          hintWarnings.push(
            `unexpected status.warnings.${k} = ${String(
              e
            )} – Please implement expectStatusWarnings on the mutation if expected`
          );
        }
      }
    }

    mutationsCount[mutation.name] = (mutationsCount[mutation.name] || 0) + 1;
    // sign the transaction with speculos
    log("engine", `spec ${spec.name}/${account.name} signing`);
    const signedOperation = await accountBridge
      .signOperation({
        account,
        transaction,
        deviceId: device.id,
      })
      .pipe(
        tap((e) => {
          latestSignOperationEvent = e;
          log("engine", `spec ${spec.name}/${account.name}: ${e.type}`);
        }),
        autoSignTransaction({
          transport: device.transport,
          deviceAction: mutation.deviceAction || spec.genericDeviceAction,
          appCandidate,
          account,
          transaction,
          status,
        }),
        first((e: any) => e.type === "signed"),
        map(
          (e) => (
            invariant(e.type === "signed", "signed operation"),
            e.signedOperation
          )
        )
      )
      .toPromise();
    deepFreezeSignedOperation(signedOperation);

    report.signedOperation = signedOperation;
    report.signedTime = now();

    // at this stage, we are about to broadcast we assume we will need to resync receiver account
    if (report.destination) {
      accountIdsNeedResync.push(report.destination.id);
    }
    // even if the test will actively sync the account, we need to pessimisticly assume it won't, we may not reach the final step of it.
    // after the runOnAccount() call, we actively remove from accountIdsNeedResync the account.id if it is actually sucessful
    accountIdsNeedResync.push(account.id);

    // broadcast the transaction
    const optimisticOperation = getEnv("DISABLE_TRANSACTION_BROADCAST")
      ? signedOperation.operation
      : await accountBridge
          .broadcast({
            account,
            signedOperation,
          })
          .catch((e) => {
            // wrap the error into some bot test context
            botTest("during broadcast", () => {
              throw e;
            });
          });

    deepFreezeOperation(optimisticOperation);
    report.optimisticOperation = optimisticOperation;
    report.broadcastedTime = now();
    log(
      "engine",
      `spec ${spec.name}/${account.name}/${optimisticOperation.hash} broadcasted`
    );

    // wait the condition are good (operation confirmed)
    // test() is run over and over until either timeout is reach OR success
    const testBefore = now();
    const timeOut = mutation.testTimeout || spec.testTimeout || 5 * 60 * 1000;
    const step = (account) => {
      const timedOut = now() - testBefore > timeOut;
      const operation = account.operations.find(
        (o) => o.id === optimisticOperation.id
      );

      if (timedOut && !operation) {
        botTest("waiting operation id to appear after broadcast", () => {
          throw new Error(
            "could not find optimisticOperation " + optimisticOperation.id
          );
        });
      }

      if (operation) {
        try {
          const arg = {
            accountBeforeTransaction,
            transaction,
            status,
            optimisticOperation,
            operation,
            account,
          };
          transactionTest(arg);
          if (spec.test) spec.test(arg);
          if (mutation.test) mutation.test(arg);
          report.testDuration = now() - testBefore;
        } catch (e) {
          // this is too critical to "ignore"
          if (e instanceof TypeError || e instanceof SyntaxError) {
            report.testDuration = now() - testBefore;
            throw e;
          }
          // We never reach the final test success
          if (timedOut) {
            report.testDuration = now() - testBefore;
            throw e;
          }

          log("bot", "failed confirm test. trying again. " + String(e));
          // We will try again
          return;
        }
      }

      return operation;
    };

    const result = await awaitAccountOperation<Operation>({ account, step });
    const { account: finalAccount, value: operation } = result;
    report.finalAccount = finalAccount;
    report.operation = operation;
    report.confirmedTime = now();
    log(
      "engine",
      `spec ${spec.name}/${account.name}/${optimisticOperation.hash} confirmed`
    );

    const destinationBeforeTransaction = destination;
    if (destination && mutation.testDestination) {
      const { testDestination } = mutation;
      // test() is run over and over until either timeout is reach OR success
      const ntestBefore = now();
      const newTimeOut = Math.max(10000, timeOut - (ntestBefore - testBefore));
      log(
        "bot",
        "remaining time to test destination: " +
          (newTimeOut / 1000).toFixed(0) +
          "s"
      );
      const sendingOperation = operation;
      const step = (account) => {
        const timedOut = now() - ntestBefore > newTimeOut;
        let operation;
        try {
          operation = account.operations.find(
            (op) => op.hash === sendingOperation.hash
          );
          botTest(
            "destination account should receive an operation (by tx hash)",
            () =>
              invariant(
                operation,
                "no operation found with hash %s",
                sendingOperation.hash
              )
          );
          if (!operation) throw new Error();
          const arg: TransactionDestinationTestInput<T> = {
            transaction,
            status,
            sendingAccount: finalAccount,
            sendingOperation,
            operation,
            destinationBeforeTransaction,
            destination: account,
          };
          botTest("destination", () => testDestination(arg));
          report.testDestinationDuration = now() - ntestBefore;
        } catch (e) {
          // this is too critical to "ignore"
          if (e instanceof TypeError || e instanceof SyntaxError) {
            report.testDuration = now() - testBefore;
            throw e;
          }
          // We never reach the final test success
          if (timedOut) {
            report.testDestinationDuration = now() - ntestBefore;
            throw e;
          }
          log(
            "bot",
            "failed destination confirm test. trying again. " + String(e)
          );
          // We will try again
          return;
        }
        return operation;
      };
      const result = await awaitAccountOperation<Operation>({
        account: destination,
        step,
      });
      report.finalDestination = result.account;
      report.finalDestinationOperation = result.value;
      report.destinationConfirmedTime = now();
    }
  } catch (error: any) {
    if (process.env.CI) console.error(error);
    log("mutation-error", spec.name + ": " + formatError(error, true));
    report.error = error;
    report.errorTime = now();
  }

  report.latestSignOperationEvent = latestSignOperationEvent;
  return report;
}

async function syncAccount(initialAccount: Account): Promise<Account> {
  const acc = await getAccountBridge(initialAccount)
    .sync(initialAccount, {
      paginationConfig: {},
    })
    .pipe(
      reduce((a, f: (arg0: Account) => Account) => f(a), initialAccount),
      timeoutWith(
        10 * 60 * 1000,
        throwError(new Error("account sync timeout for " + initialAccount.name))
      )
    )
    .toPromise();
  return deepFreezeAccount(acc);
}

export function autoSignTransaction<T extends Transaction>({
  transport,
  deviceAction,
  appCandidate,
  account,
  transaction,
  status,
  disableStrictStepValueValidation,
}: {
  transport: any;
  deviceAction: DeviceAction<T, any>;
  appCandidate: AppCandidate;
  account: Account;
  transaction: T;
  status: TransactionStatus;
  disableStrictStepValueValidation?: boolean;
}): OperatorFunction<SignOperationEvent, SignOperationEvent> {
  let sub;
  let observer;
  let state;
  const recentEvents: SignOperationEvent[] = [];
  return mergeMap<SignOperationEvent, Observable<SignOperationEvent>>((e) => {
    if (e.type === "device-signature-requested") {
      return new Observable((o) => {
        if (observer) {
          o.error(
            new Error("device-signature-requested should not be called twice!")
          );
          return;
        }

        observer = o;
        o.next(e);
        const timeout = setTimeout(() => {
          o.error(
            new Error(
              "device action timeout. Recent events was:\n" +
                recentEvents.map((e) => JSON.stringify(e)).join("\n")
            )
          );
        }, 60 * 1000);
        sub = transport.automationEvents
          .pipe(
            // deduplicate two successive identical text in events (that can sometimes occur with speculos)
            distinctUntilChanged(
              (a: DeviceActionEvent, b: DeviceActionEvent) => a.text === b.text
            )
          )
          .subscribe({
            next: (event) => {
              recentEvents.push(event);

              if (recentEvents.length > 5) {
                recentEvents.shift();
              }

              try {
                state = deviceAction({
                  appCandidate,
                  account,
                  transaction,
                  event,
                  transport,
                  state,
                  status,
                  disableStrictStepValueValidation,
                });
              } catch (e) {
                o.error(e);
              }
            },
            complete: () => {
              o.complete();
            },
            error: (e) => {
              o.error(e);
            },
          });
        return () => {
          clearTimeout(timeout);
          sub.unsubscribe();
        };
      });
    } else if (observer) {
      observer.complete();
      observer = null;
    }

    if (sub) {
      sub.unsubscribe();
    }

    return of<SignOperationEvent>(e);
  });
}

function awaitAccountOperation<T>({
  account,
  step,
}: {
  account: Account;
  step: (arg0: Account) => T | null | undefined;
}): Promise<{
  account: Account;
  value: T;
}> {
  log("engine", "awaitAccountOperation on " + account.name);
  let syncCounter = 0;
  let acc = account;
  let lastSync = now();
  const loopDebounce = 1000;
  const targetInterval = getEnv("SYNC_PENDING_INTERVAL");

  async function loop() {
    const value = step(acc);

    if (value) {
      return {
        account: acc,
        value,
      };
    }
    const spent = now() - lastSync;
    await delay(Math.max(loopDebounce, targetInterval - spent));

    lastSync = now();
    log("engine", "sync #" + syncCounter++ + " on " + account.name);
    acc = await syncAccount(acc);
    const r = await loop();
    return r;
  }

  return loop();
}

// generic transaction test: make sure you are sure all coins suit the tests here
function transactionTest<T>({
  operation,
  optimisticOperation,
  account,
  accountBeforeTransaction,
}: TransactionTestInput<T>) {
  const dt = Date.now() - operation.date.getTime();
  const lowerThreshold = -60 * 1000; // -1mn accepted
  const upperThreshold = 30 * 60 * 1000; // 30mn up
  botTest("operation.date must not be in future", () =>
    expect(dt).toBeGreaterThan(lowerThreshold)
  );
  botTest("operation.date less than 30mn ago", () =>
    expect(dt).toBeLessThan(upperThreshold)
  );
  botTest("operation must not failed", () => {
    expect(!operation.hasFailed).toBe(true);
  });

  const { blockAvgTime } = account.currency;

  if (blockAvgTime && account.blockHeight) {
    const expected = getOperationConfirmationNumber(operation, account);
    const expectedMax = Math.ceil(upperThreshold / blockAvgTime);
    botTest("low amount of confirmations", () =>
      invariant(
        expected <= expectedMax,
        "There are way too much operation confirmation for a small amount of time. %s < %s",
        expected,
        expectedMax
      )
    );
  }

  botTest("optimisticOperation.value must not be NaN", () =>
    expect(!optimisticOperation.value.isNaN()).toBe(true)
  );
  botTest("optimisticOperation.fee must not be NaN", () =>
    expect(!optimisticOperation.fee.isNaN()).toBe(true)
  );
  botTest("operation.value must not be NaN", () =>
    expect(!operation.value.isNaN()).toBe(true)
  );
  botTest("operation.fee must not be NaN", () =>
    expect(!operation.fee.isNaN()).toBe(true)
  );

  botTest(
    "successful tx should increase by at least 1 the number of account.operations",
    () =>
      expect(account.operations.length).toBeGreaterThanOrEqual(
        accountBeforeTransaction.operations.length + 1
      )
  );
}

/*
function deepFreeze(object, path: string[] = []) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if (value && typeof value === "object") {
      deepFreeze(value, [...path, name.toString()]);
    }
  }

  try {
    return Object.freeze(object);
  } catch (e) {
    console.warn("Can't freeze at " + path.join("."));
  }
}
*/

// deepFreeze logic specialized to freeze an account (it's too problematic to deep freeze all objects of Account too deeply)
function deepFreezeAccount<T extends AccountLike>(account: T): T {
  Object.freeze(account);
  if (account.type === "Account") {
    account.subAccounts?.forEach(deepFreezeAccount);
    account.nfts?.forEach(Object.freeze);
  }
  account.operations.forEach(deepFreezeOperation);
  account.pendingOperations.forEach(deepFreezeOperation);
  return account;
}

function deepFreezeOperation(operation: Operation): Operation {
  Object.freeze(operation);
  return operation;
}

function deepFreezeSignedOperation(
  signedOperation: SignedOperation
): SignedOperation {
  Object.freeze(signedOperation);
  Object.freeze(signedOperation.operation);
  return signedOperation;
}

function deepFreezeStatus(
  transactionStatus: TransactionStatus
): TransactionStatus {
  Object.freeze(transactionStatus);
  return transactionStatus;
}

function deepFreezeTransaction<T extends TransactionCommon>(transaction: T): T {
  Object.freeze(transaction);
  return transaction;
}
