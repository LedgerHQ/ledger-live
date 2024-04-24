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
   * @param initialAccount initialAccount returned by the latest sync before the transaction broadcast
   * @param currentAccount currentAccount updated after completting the latest transaction
   * @returns void
   */
  expect?: (initialAccount: Account, currentAccount: Account) => void;
};

export type Scenario<T extends TransactionCommon> = {
  name: string;
  setup: () => Promise<{
    accountBridge: AccountBridge<T>;
    currencyBridge: CurrencyBridge;
    account: Account;
    testTimeout?: number;
    retryInterval?: number;
    onSignerConfirmation?: (e?: SignOperationEvent) => Awaited<void>;
  }>;
  transactions: ScenarioTransaction<T>[];
  beforeAll?: (account: Account) => Awaited<void>;
  afterAll?: (account: Account) => Awaited<void>;
  beforeEach?: (account: Account) => Awaited<void>;
  afterEach?: (account: Account) => Awaited<void>;
  teardown?: () => void;
};

export async function executeScenario<T extends TransactionCommon>(scenario: Scenario<T>) {
  try {
    const { accountBridge, currencyBridge, account, retryInterval, onSignerConfirmation } =
      await scenario.setup();

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

    for (const testTransaction of scenario.transactions) {
      console.log("\n");
      console.log(chalk.cyan("Transaction:", chalk.bold(testTransaction.name), "◌"));

      scenario.beforeEach?.(scenarioAccount);
      if (scenario.transactions.indexOf(testTransaction) > 0) {
        scenarioAccount = await firstValueFrom(
          accountBridge
            .sync(scenarioAccount, { paginationConfig: {} })
            .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
        );
      }

      const initialAccount = Object.freeze({ ...scenarioAccount });

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

      if (!signedOperation) {
        throw new Error("Could not sign operation");
      }

      const optimisticOperation = await accountBridge.broadcast({
        account: scenarioAccount,
        signedOperation,
      });

      console.log(" → ", "🛫 ", chalk.bold("Broadcated the transaction"), "✓");

      const retry_limit = 10;

      const expectHandler = async (retry: number) => {
        scenarioAccount = await firstValueFrom(
          accountBridge
            .sync(
              { ...scenarioAccount, pendingOperations: [optimisticOperation] },
              { paginationConfig: {} },
            )
            .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
        );

        try {
          testTransaction.expect?.(initialAccount, scenarioAccount);
        } catch (err) {
          if (!(err as { matcherResult?: { pass: boolean } })?.matcherResult?.pass) {
            if (retry === 0) {
              console.error("Retried 10 times and could not assert this test");
              throw err;
            }

            console.warn("Test asssertion failed. Retrying...");
            await new Promise(resolve => setTimeout(resolve, retryInterval || 5000));
            await expectHandler(retry - 1);
          }

          throw err;
        }
      };

      await expectHandler(retry_limit);

      scenario.afterEach?.(scenarioAccount);
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
    console.log(
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
