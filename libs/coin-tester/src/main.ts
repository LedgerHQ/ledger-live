import {
  AccountBridge,
  Account,
  TransactionCommon,
  SignOperationEvent,
  CurrencyBridge,
} from "@ledgerhq/types-live";
import chalk from "chalk";
import { first, firstValueFrom, map, reduce } from "rxjs";

export type ScenarioTransaction<T extends TransactionCommon> = Partial<T> & {
  name: string;
  /**
   *
   * @param previousAccount previousAccount returned by the latest sync before broadcasting this transaction
   * @param currentAccount currentAccount synced after broadcasting this transaction
   * @returns void
   */
  expect?: (previousAccount: Account, currentAccount: Account) => void;
};

export type Scenario<T extends TransactionCommon> = {
  name: string;
  setup: () => Promise<{
    accountBridge: AccountBridge<T>;
    currencyBridge: CurrencyBridge;
    account: Account;
    retryInterval?: number;
    retryLimit?: number;
    onSignerConfirmation?: (e?: SignOperationEvent) => Promise<void>;
  }>;
  getTransactions: (address: string) => ScenarioTransaction<T>[];
  beforeAll?: (account: Account) => Promise<void> | void;
  afterAll?: (account: Account) => Promise<void> | void;
  beforeEach?: (account: Account) => Promise<void> | void;
  afterEach?: (account: Account) => Promise<void> | void;
  teardown?: () => Promise<void> | void;
};

export async function executeScenario<T extends TransactionCommon>(scenario: Scenario<T>) {
  try {
    const {
      accountBridge,
      currencyBridge,
      account,
      retryInterval,
      retryLimit,
      onSignerConfirmation,
    } = await scenario.setup();

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

    console.log("Running a synchronization on the account...");
    let scenarioAccount = await firstValueFrom(
      accountBridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((acc, f) => f(acc), account)),
    );
    console.log("Synchronization completed ✓");

    await scenario.beforeAll?.(scenarioAccount);
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

    const scenarioTransactions = scenario.getTransactions(account.freshAddress);

    for (const testTransaction of scenarioTransactions) {
      console.log("\n");
      console.log(chalk.cyan("Transaction:", chalk.bold(testTransaction.name), "◌"));

      scenario.beforeEach?.(scenarioAccount);
      console.log("Before each ✔️");

      if (scenarioTransactions.indexOf(testTransaction) > 0) {
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
        throw new Error(`Error in transaction status: ${JSON.stringify(status.errors, null, 3)}`);
      }

      console.log(" → ", "🪲  ", chalk.bold("No status errors detected"), "✓");

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
        account: scenarioAccount,
        signedOperation,
      });

      console.log(" → ", "🛫 ", chalk.bold("Broadcasted the transaction"), "✓");

      const retry_limit = retryLimit ?? 10;

      const expectHandler = async (retry: number) => {
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
        }

        try {
          testTransaction.expect?.(previousAccount, scenarioAccount);
        } catch (err) {
          if (!(err as { matcherResult?: { pass: boolean } })?.matcherResult?.pass) {
            if (retry === 0) {
              console.error(
                chalk.red(
                  `Retried 10 times and could not assert all expects for transaction ${chalk.bold(
                    testTransaction.name,
                  )}`,
                ),
              );

              throw err;
            }

            console.warn(chalk.magenta("Test asssertion failed. Retrying..."));
            await new Promise(resolve => setTimeout(resolve, retryInterval ?? 5000));
            await expectHandler(retry - 1);
          }

          throw err;
        }
      };

      await expectHandler(retry_limit);

      scenario.afterEach?.(scenarioAccount);
      console.log("After each ✔️");
      console.log(chalk.green("Transaction:", chalk.bold(testTransaction.name), "completed  ✓"));
    }

    console.log("\n");

    await scenario.afterAll?.(scenarioAccount);
    console.log("afterAll completed ✓");
    console.log("Stopping engine...");
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
