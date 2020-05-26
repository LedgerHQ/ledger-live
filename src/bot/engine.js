// @flow
import invariant from "invariant";
import now from "performance-now";
import sample from "lodash/sample";
import { first, filter, map, reduce, tap } from "rxjs/operators";
import { log } from "@ledgerhq/logs";
import type {
  Transaction,
  Account,
  AccountBridge,
  Operation,
  SignOperationEvent,
  CryptoCurrency,
} from "../types";
import { getCurrencyBridge, getAccountBridge } from "../bridge";
import { promiseAllBatched } from "../promise";
import { formatAccount } from "../account";
import { isCurrencySupported } from "../currencies";
import { getEnv } from "../env";
import { delay } from "../promise";
import {
  listAppCandidates,
  createSpeculosDevice,
  releaseSpeculosDevice,
  appCandidatesMatches,
} from "../load/speculos";
import deviceActions from "../generated/speculos-deviceActions";
import type { AppCandidate } from "../load/speculos";
import { formatReportForConsole } from "./formatters";
import type { AppSpec, MutationReport, DeviceAction } from "./types";

let appCandidates;

export async function runWithAppSpec<T: Transaction>(
  spec: AppSpec<T>,
  reportLog: (string) => void
): Promise<MutationReport<T>[]> {
  if (!isCurrencySupported(spec.currency)) {
    return Promise.resolve([]);
  }

  const seed = getEnv("SEED");
  invariant(seed, "SEED is not set");

  const coinapps = getEnv("COINAPPS");
  invariant(coinapps, "COINAPPS is not set");

  if (!appCandidates) {
    appCandidates = await listAppCandidates(coinapps);
  }
  const reports = [];

  const { appQuery, currency, dependency } = spec;

  const appCandidate = sample(
    appCandidates.filter((appCandidate) =>
      appCandidatesMatches(appCandidate, appQuery)
    )
  );
  invariant(appCandidate, "no app found for appQuery of " + spec.name);

  const device = await createSpeculosDevice({
    ...appCandidate,
    appName: spec.currency.managerAppName,
    seed,
    dependency,
    coinapps,
  });

  try {
    const bridge = getCurrencyBridge(currency);
    const syncConfig = { paginationConfig: {} };

    await bridge.preload();

    // Scan all existing accounts
    let accounts = await bridge
      .scanAccounts({ currency, deviceId: device.id, syncConfig })
      .pipe(
        filter((e) => e.type === "discovered"),
        map((e) => e.account),
        reduce((all, a) => all.concat(a), [])
      )
      .toPromise();

    invariant(
      accounts.length > 0,
      "unexpected empty accounts for " + currency.name
    );

    reportLog(
      `Spec '${spec.name}' found ${accounts.length} ${
        currency.name
      } accounts:\n${accounts
        .map((a) => "  - " + formatAccount(a, "summary"))
        .join("\n")}`
    );

    if (accounts.length < 2) {
      reportLog(
        `This SEED does not have ${currency.name}. Please send funds to ${accounts[0].freshAddress}`
      );
      return reports;
    }

    // we sequentially iterate on the initial account set to perform mutations
    const length = accounts.length;
    for (let i = 0; i < length; i++) {
      // resync all accounts (necessary between mutations)
      accounts = await promiseAllBatched(5, accounts, syncAccount);
      const account = accounts[i];
      const report = await runOnAccount({
        appCandidate,
        spec,
        device,
        account,
        accounts,
      });
      reportLog(formatReportForConsole(report));
      reports.push(report);
    }
  } finally {
    releaseSpeculosDevice(device.id);
  }
  return reports;
}

export async function runOnAccount<T: Transaction>({
  appCandidate,
  spec,
  device,
  account,
  accounts,
}: {
  appCandidate: *,
  spec: AppSpec<T>,
  device: *,
  account: *,
  accounts: *,
}): Promise<MutationReport<T>> {
  const { mutations } = spec;

  let report: MutationReport<T> = { spec, appCandidate };
  try {
    const accountBridge = getAccountBridge(account);
    const accountBeforeTransaction = account;
    report.account = account;

    const candidates = [];
    const unavailableMutationReasons = [];

    for (const mutation of mutations) {
      try {
        const tx = mutation.transaction({
          appCandidate,
          account,
          bridge: accountBridge,
          siblings: accounts.filter((a) => a !== account),
        });
        if (tx) {
          candidates.push({ mutation, tx });
        }
      } catch (e) {
        unavailableMutationReasons.push(mutation.name + ": " + e.message);
      }
    }

    const candidate = sample(candidates);

    if (!candidate) {
      // no mutation were suitable
      report.unavailableMutationReasons = unavailableMutationReasons;
      return report;
    }

    // a mutation was chosen
    const { tx, mutation } = candidate;
    report.mutation = mutation;
    report.transaction = tx;
    report.destination = accounts.find((a) => a.freshAddress === tx.recipient);

    // prepare the transaction and ensure it's valid
    const transaction = await accountBridge.prepareTransaction(account, tx);
    report.transaction = transaction;
    report.transactionTime = now();

    const status = await accountBridge.getTransactionStatus(
      account,
      transaction
    );
    report.status = status;
    report.statusTime = now();

    const errors = Object.values(status.errors);
    if (errors.length) {
      // FIXME more errors to be included?
      throw errors[0];
    }

    // sign the transaction with speculos

    const signedOperation = await accountBridge
      .signOperation({ account, transaction, deviceId: device.id })
      .pipe(
        autoSignTransaction({
          transport: device.transport,
          deviceAction:
            mutation.deviceAction || getImplicitDeviceAction(account.currency),
          appCandidate,
          transaction,
        }),
        first((e) => e.type === "signed"),
        map(
          (e) => (
            invariant(e.type === "signed", "signed operation"),
            e.signedOperation
          )
        )
      )
      .toPromise();
    report.signedOperation = signedOperation;
    report.signedTime = now();

    // broadcast the transaction
    const optimisticOperation = getEnv("DISABLE_TRANSACTION_BROADCAST")
      ? signedOperation.operation
      : await accountBridge.broadcast({
          account,
          signedOperation,
        });
    report.optimisticOperation = optimisticOperation;
    report.broadcastedTime = now();

    // wait the condition are good (operation confirmed)
    const result = await awaitAccountOperation({
      account,
      accountBridge,
      optimisticOperation,
      timeout: 60 * 1000,
    });
    report.finalAccount = result.account;
    report.operation = result.operation;
    report.confirmedTime = now();

    // do potential final tests
    if (mutation.test) {
      mutation.test({
        accountBeforeTransaction,
        transaction,
        status,
        optimisticOperation,
        operation: result.operation,
        account: result.account,
      });
    }
  } catch (error) {
    report.error = error;
  }
  return report;
}

async function syncAccount(initialAccount: Account): Promise<Account> {
  const acc = await getAccountBridge(initialAccount)
    .sync(initialAccount, { paginationConfig: {} })
    .pipe(reduce((a, f: (Account) => Account) => f(a), initialAccount))
    .toPromise();
  return acc;
}

export function autoSignTransaction<T: Transaction>({
  transport,
  deviceAction,
  appCandidate,
  transaction,
}: {
  transport: *,
  deviceAction: DeviceAction<T, *>,
  appCandidate: AppCandidate,
  transaction: T,
}) {
  let sub;
  let state;
  return tap<SignOperationEvent>((e: SignOperationEvent) => {
    log("engine", `device-event: ${e.type}`);
    if (e.type === "device-signature-requested") {
      // TODO we need a timeout on this.
      // TODO event probably can be pushed in the report because it will be useful to debug.
      sub = transport.automationEvents.subscribe((event) => {
        log("speculos", "automationEvents: " + JSON.stringify(event)); // TODO move in transport itself
        state = deviceAction({
          appCandidate,
          transaction,
          event,
          transport,
          state,
        });
      });
    }
    if (e.type === "signed" && sub) {
      sub.unsubscribe();
    }
  });
}

export function getImplicitDeviceAction(currency: CryptoCurrency) {
  const actions = deviceActions[currency.family];
  const accept = actions && actions.acceptTransaction;
  invariant(
    accept,
    "a acceptTransaction is missing for family %s",
    currency.family
  );
  return accept;
}

function awaitAccountOperation<T>({
  account,
  optimisticOperation,
  timeout = 1000 * 60 * 5, // 5mn
}: {
  account: Account,
  accountBridge: AccountBridge<T>,
  optimisticOperation: Operation,
  timeout: number,
}): Promise<{ account: Account, operation: Operation }> {
  log("engine", "awaitAccountOperation on " + account.name);
  let syncCounter = 0;
  let acc = account;

  const startTime = Date.now();

  async function loop() {
    if (Date.now() - startTime > timeout) {
      throw new Error(
        "could not find optimisticOperation " + optimisticOperation.id
      );
    }
    log("engine", "sync #" + syncCounter++ + " on " + account.name);
    await delay(5000);
    acc = await syncAccount(acc);

    const operation = acc.operations.find(
      (o) => o.id === optimisticOperation.id
    );
    if (operation) {
      log("engine", "found " + operation.id);
      return { account: acc, operation };
    }

    const r = await loop();
    return r;
  }

  return loop();
}
