import {
  AccountBridge,
  Account,
  TransactionCommon,
  SignOperationEvent,
  CurrencyBridge,
} from "@ledgerhq/types-live";
import { AssertionError } from "assert";
import chalk from "chalk";
import { first, firstValueFrom, map, reduce } from "rxjs";

export type ScenarioTransaction<T> = T & {
  name: string;
  expect?: (account: Account) => void;
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
  transactions: ScenarioTransaction<Partial<T>>[];
  beforeAll?: () => Awaited<void>;
  afterAll?: () => Awaited<void>;
  afterEach?: () => Awaited<void>;
  teardown?: () => void;
};

export async function executeScenario<T extends TransactionCommon>(scenario: Scenario<T>) {
  const { accountBridge, currencyBridge, account, retryInterval, onSignerConfirmation } =
    await scenario.setup();

  console.log("Setup completed ✓");

  await scenario.beforeAll?.();
  console.log("BeforeAll completed ✓");

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
    accountBridge.sync(account, { paginationConfig: {} }).pipe(reduce((acc, f) => f(acc), account)),
  );
  console.log("Synchronization completed ✓");

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

    if (scenario.transactions.indexOf(testTransaction) > 0) {
      scenarioAccount = await firstValueFrom(
        accountBridge
          .sync(scenarioAccount, { paginationConfig: {} })
          .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
      );
    }

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

    const rety_limit = 10;

    const expcectHandler = async (retry = rety_limit) => {
      scenarioAccount = await firstValueFrom(
        accountBridge
          .sync(
            { ...scenarioAccount, pendingOperations: [optimisticOperation] },
            { paginationConfig: {} },
          )
          .pipe(reduce((acc, f) => f(acc), scenarioAccount)),
      );

      try {
        testTransaction.expect?.(scenarioAccount);
      } catch (e) {
        if (e instanceof AssertionError) {
          if (retry === 0) {
            console.error("Retried 10 times and could not assert this test");
            throw e;
          }

          console.warn("Test asssertion failed. Retrying...");
          await new Promise(resolve => setTimeout(resolve, retryInterval || 5000));
          expcectHandler(retry - 1);
        }

        throw e;
      }
    };

    expcectHandler();
    scenario.afterEach?.();
    console.log(chalk.green("Transaction:", chalk.bold(testTransaction.name), "completed  ✓⃝"));
  }

  console.log("\n");

  await scenario.afterAll?.();
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
}
