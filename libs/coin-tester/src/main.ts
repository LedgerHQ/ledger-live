import {
  AccountBridge,
  Account,
  TransactionCommon,
  SignOperationEvent,
  CurrencyBridge,
  Operation,
} from "@ledgerhq/types-live";
import chalk from "chalk";
import { first, firstValueFrom, map, reduce } from "rxjs";
import { BridgeStrategy } from "./types";

/**
 * Shape of Jest's assertion error when a matcher fails.
 * @see https://jestjs.io/docs/expect#matchers
 */
export type JestAssertionError = Error & {
  matcherResult?: {
    pass: boolean;
    message?: string | (() => string);
    expected?: unknown;
    actual?: unknown;
    name?: string;
  };
};

function isJestAssertionError(err: unknown): err is JestAssertionError {
  if (!(err instanceof Error) || !("matcherResult" in err)) return false;
  const mr = Object.getOwnPropertyDescriptor(err, "matcherResult")?.value;
  return typeof mr === "object" && mr !== null;
}

/** Build a short summary of the failed assertion for logging. */
function formatAssertionFailureSummary(err: unknown): string {
  function formatValue(v: unknown): string {
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  if (!isJestAssertionError(err)) return err instanceof Error ? err.message : String(err);

  const mr = err.matcherResult;
  if (!mr) return err.message;

  const message = typeof mr.message === "function" ? mr.message() : (mr.message ?? err.message);
  const parts: string[] = [message];
  if (mr.expected !== undefined) parts.push(`Expected: ${formatValue(mr.expected)}`);
  if (mr.actual !== undefined) parts.push(`Received: ${formatValue(mr.actual)}`);
  return parts.join("\n");
}

export type ScenarioTransaction<T extends TransactionCommon, A extends Account> = Partial<T> & {
  name: string;
  /**
   *
   * @description assert the account state after the transaction
   * @param previousAccount previousAccount returned by the latest sync before broadcasting this transaction
   * @param currentAccount currentAccount synced after broadcasting this transaction
   * @returns void
   */
  expect?: (previousAccount: A, currentAccount: A) => void;
  /**
   * FOR DEV ONLY
   * if you want to temporarily disable the expect for a transaction
   * You should push a transaction with a xexpect
   */
  xexpect?: (previousAccount: A, currentAccount: A) => void;
};

export type Scenario<T extends TransactionCommon, A extends Account> = {
  name: string;
  setup: (strategy: BridgeStrategy) => Promise<{
    accountBridge: AccountBridge<T, A>;
    currencyBridge: CurrencyBridge;
    account: A;
    retryInterval?: number;
    retryLimit?: number;
    onSignerConfirmation?: (e?: SignOperationEvent) => Promise<void>;
  }>;
  getTransactions: (address: string, strategy: BridgeStrategy) => ScenarioTransaction<T, A>[];
  getInternalTransactions?: (
    address: string,
    strategy: BridgeStrategy,
  ) => Promise<ScenarioTransaction<T, A>[]>;
  beforeSync?: () => Promise<void> | void;
  mockIndexer?: (account: A, optimistic: Operation) => Promise<void>;
  beforeAll?: (account: A, strategy: BridgeStrategy) => Promise<void> | void;
  afterAll?: (account: A, strategy: BridgeStrategy) => Promise<void> | void;
  beforeEach?: (account: A) => Promise<void> | void;
  afterEach?: (account: A) => Promise<void> | void;
  teardown?: () => Promise<void> | void;
};

export async function executeScenario<T extends TransactionCommon, A extends Account>(
  scenario: Scenario<T, A>,
  strategy: BridgeStrategy = "legacy",
) {
  try {
    const {
      accountBridge,
      currencyBridge,
      account,
      retryInterval,
      retryLimit,
      onSignerConfirmation,
    } = await scenario.setup(strategy);

    console.log("Setup completed ✓");

    console.log("\n");
    console.log(
      chalk.bgBlue("     Address     "),
      " → ",
      chalk.bold.blue(account.freshAddress),
      "\n\n",
    );

    const data = await currencyBridge.preload(account.currency);
    currencyBridge.hydrate(data, account.currency);
    console.log("Preload + hydrate completed ✓");

    await scenario.beforeSync?.();
    console.log("Running a synchronization on the account...");
    let scenarioAccount = await firstValueFrom(
      accountBridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((acc, f) => f(acc), account)),
    );
    console.log("Synchronization completed ✓");

    await scenario.beforeAll?.(scenarioAccount, strategy);
    console.log("BeforeAll completed ✓");

    console.log("\n\n");
    console.log(
      chalk.bgCyan.black.bold(" ✧ "),
      " ",
      chalk.cyan(`Scenario: ${chalk.italic.bold(scenario.name)}`),

      " ",
      chalk.bgCyan.black.bold(" ✧ "),
      " → ",
      chalk.bold.cyan(" Starting  ◌"),
    );

    const scenarioTransactions = scenario.getTransactions(account.freshAddress, strategy);
    const internalScenarioTransactions = await scenario.getInternalTransactions?.(
      account.freshAddress,
      strategy,
    );
    for (const testTransaction of scenarioTransactions) {
      console.log("\n");
      console.log(chalk.cyan("Transaction:", chalk.bold(testTransaction.name), "◌"));

      await scenario.beforeEach?.(scenarioAccount);
      console.log("Before each ✔️");

      if (scenarioTransactions.indexOf(testTransaction) > 0) {
        await scenario.beforeSync?.();
        scenarioAccount = await firstValueFrom(
          accountBridge
            .sync(scenarioAccount, { paginationConfig: {} })
            .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
        );
      }

      const previousAccount = Object.freeze(scenarioAccount);

      const defaultTransaction = accountBridge.createTransaction(scenarioAccount);
      const transaction = await accountBridge.prepareTransaction(scenarioAccount, {
        ...defaultTransaction,
        ...testTransaction,
      } as T);

      console.log(" → ", "🧑‍🍳 ", chalk.bold("Prepared the transaction"), "✓");

      const status = await accountBridge.getTransactionStatus(scenarioAccount, transaction);
      if (Object.entries(status.errors).length) {
        throw new Error(
          `${testTransaction.name} transaction\nError in transaction status: ${JSON.stringify(status.errors, null, 3)}`,
        );
      }

      console.log(" → ", "🪲 ", chalk.bold("No status errors detected"), "✓");

      const { signedOperation } = await firstValueFrom(
        accountBridge
          .signOperation({
            account: scenarioAccount,
            transaction,
            deviceId: "",
          })
          .pipe(
            map(e => {
              if (e.type === "device-signature-requested") {
                onSignerConfirmation?.(e);
              }

              return e;
            }),
            first((e): e is SignOperationEvent & { type: "signed" } => e.type === "signed"),
          ),
      );

      console.log(" → ", "🔏 ", chalk.bold("Signed the transaction"), "✓");

      const optimisticOperation = await accountBridge.broadcast({
        signedOperation,
        account: scenarioAccount,
      });

      console.log(" → ", "🛫 ", chalk.bold("Broadcasted the transaction"), "✓");

      const retry_limit = retryLimit ?? 10;

      async function expectHandler(retry: number) {
        await scenario.beforeSync?.();
        scenarioAccount = await firstValueFrom(
          accountBridge
            .sync(
              { ...scenarioAccount, pendingOperations: [optimisticOperation] },
              { paginationConfig: {} },
            )
            .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
        );

        if (!testTransaction.expect) {
          console.warn(
            chalk.yellow(
              `No expects in the transaction ${chalk.bold(
                testTransaction.name,
              )}. You might want to add tests in this transaction.`,
            ),
          );

          return;
        }

        try {
          testTransaction.expect?.(previousAccount, scenarioAccount);
        } catch (err: unknown) {
          if (isJestAssertionError(err) && err.matcherResult?.pass === false) {
            if (retry === 0) {
              console.error(
                chalk.red(
                  `Retried ${retry_limit} time(s) and could not assert all expects for transaction ${chalk.bold(
                    testTransaction.name,
                  )}`,
                ),
              );
              console.error(chalk.red("Assertion summary:\n"), formatAssertionFailureSummary(err));
              throw err;
            }
            console.warn(chalk.magenta("Test assertion failed. Retrying..."));
            await new Promise(resolve => setTimeout(resolve, retryInterval ?? 3 * 1000));
            await expectHandler(retry - 1);
          } else {
            throw err;
          }
        }
      }

      await scenario.mockIndexer?.(scenarioAccount, optimisticOperation);
      await expectHandler(retry_limit);

      await scenario.afterEach?.(scenarioAccount);
      console.log("After each ✔️");
      console.log(chalk.green("Transaction:", chalk.bold(testTransaction.name), "completed  ✓"));
    }

    if (internalScenarioTransactions && internalScenarioTransactions.length > 0) {
      for (const internalTestTransaction of internalScenarioTransactions) {
        console.log("\n");
        console.log(chalk.cyan("Transaction:", chalk.bold(internalTestTransaction.name), "◌"));

        await scenario.beforeEach?.(scenarioAccount);
        console.log("Before each ✔️");

        if (internalScenarioTransactions.indexOf(internalTestTransaction) > 0) {
          await scenario.beforeSync?.();
          scenarioAccount = await firstValueFrom(
            accountBridge
              .sync(scenarioAccount, { paginationConfig: {} })
              .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
          );
        }

        const previousAccount = Object.freeze(scenarioAccount);

        const retry_limit = retryLimit ?? 10;

        async function expectHandler(retry: number) {
          await scenario.beforeSync?.();
          scenarioAccount = await firstValueFrom(
            accountBridge
              .sync({ ...scenarioAccount }, { paginationConfig: {} })
              .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
          );

          if (!internalTestTransaction.expect) {
            console.warn(
              chalk.yellow(
                `No expects in the transaction ${chalk.bold(
                  internalTestTransaction.name,
                )}. You might want to add tests in this transaction.`,
              ),
            );

            return;
          }

          try {
            internalTestTransaction.expect?.(previousAccount, scenarioAccount);
          } catch (err: unknown) {
            if (isJestAssertionError(err) && err.matcherResult?.pass === false) {
              if (retry === 0) {
                console.error(
                  chalk.red(
                    `Retried ${retry_limit} time(s) and could not assert all expects for transaction ${chalk.bold(
                      internalTestTransaction.name,
                    )}`,
                  ),
                );
                console.error(
                  chalk.red("Assertion summary:\n"),
                  formatAssertionFailureSummary(err),
                );
                throw err;
              }
              console.warn(chalk.magenta("Test assertion failed. Retrying..."));
              await new Promise(resolve => setTimeout(resolve, retryInterval ?? 3 * 1000));
              await expectHandler(retry - 1);
            } else {
              throw err;
            }
          }
        }
        await expectHandler(retry_limit);
      }
      scenarioAccount = await firstValueFrom(
        accountBridge
          .sync(account, { paginationConfig: {} })
          .pipe(reduce((acc, f) => f(acc), account)),
      );
    }

    console.log("\n");

    await scenario.afterAll?.(scenarioAccount, strategy);
    console.log("afterAll completed ✓");
    await scenario.teardown?.();

    console.log(
      "\n\n",
      chalk.bgGreen.black.bold(" ✧ "),
      " ",
      chalk.green(`Scenario: ${chalk.italic.bold(scenario.name)}`),
      " ",
      chalk.bgGreen.black.bold(" ✧ "),
      " → ",
      chalk.bold.green(" Completed  🎉"),
      "\n\n",
    );
  } catch (err) {
    console.error(
      "\n\n",
      chalk.bgRed.black.bold(" ✧ "),
      " ",
      chalk.red(`Scenario: ${chalk.italic.bold(scenario.name)}`),
      " ",
      chalk.bgRed.black.bold(" ✧ "),
      " → ",
      chalk.bold.red(" Failed  ❌"),
      "\n\n",
    );

    await scenario.teardown?.();

    throw err;
  }
}
