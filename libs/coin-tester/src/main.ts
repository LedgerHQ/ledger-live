import {
  AccountBridge,
  Account,
  TransactionCommon,
  SignOperationEvent,
  CurrencyBridge,
} from "@ledgerhq/types-live";
import { AssertionError } from "assert";
import { first, firstValueFrom, map, reduce } from "rxjs";
import Transport from "@ledgerhq/hw-transport";

export type Scenario<T extends TransactionCommon> = {
  setup: () => Promise<{
    accountBridge: AccountBridge<T>;
    currencyBridge: CurrencyBridge;
    account: Account;
    transport: Transport;
    testTimeout?: number;
    retryInterval?: number;
    onSignerConfirmation?: () => Promise<void>;
  }>;
  transactions: (T & { after?: (account: Account) => void })[];
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  teardown?: () => void;
};

export async function executeScenario<T extends TransactionCommon>(scenario: Scenario<T>) {
  const { accountBridge, currencyBridge, account, retryInterval, onSignerConfirmation } =
    await scenario.setup();

  await scenario.beforeAll?.();

  const data = await currencyBridge.preload(account.currency);
  currencyBridge.hydrate(data, account.currency);

  let scenarioAccount = await firstValueFrom(
    accountBridge
      .sync(account, { paginationConfig: {} })
      .pipe(reduce((acc, f: (arg0: Account) => Account) => f(acc), account)),
  );

  for (const testTransaction of scenario.transactions) {
    if (scenario.transactions.indexOf(testTransaction) > 0) {
      scenarioAccount = await firstValueFrom(
        accountBridge
          .sync(account, { paginationConfig: {} })
          .pipe(reduce((acc, f: (arg0: Account) => Account) => f(acc), account)),
      );
    }

    const defaultTransaction = accountBridge.createTransaction(scenarioAccount);
    const transaction = await accountBridge.prepareTransaction(scenarioAccount, {
      ...defaultTransaction,
      ...testTransaction,
    } as T);

    const status = await accountBridge.getTransactionStatus(scenarioAccount, transaction);

    if (Object.entries(status.errors)) {
      throw new Error(`Error in transaction status: ${JSON.stringify(status.errors, null, 3)}`);
    }

    console.log({ status });
    const { signedOperation } = await firstValueFrom(
      accountBridge
        .signOperation({
          account,
          transaction,
          deviceId: "",
        })
        .pipe(
          map(e => {
            if (e.type === "device-signature-requested") {
              onSignerConfirmation?.();
            }

            return e;
          }),
          first((e): e is SignOperationEvent & { type: "signed" } => e.type === "signed"),
        ),
    );

    if (!signedOperation) {
      throw new Error("Could not sign operation");
    }

    const optimisticOperation = await accountBridge.broadcast({
      account: scenarioAccount,
      signedOperation,
    });

    const rety_limit = 10;

    const afterHandler = async (retry = rety_limit) => {
      scenarioAccount = await firstValueFrom(
        accountBridge
          .sync({ ...account, pendingOperations: [optimisticOperation] }, { paginationConfig: {} })
          .pipe(reduce((acc, f: (arg0: Account) => Account) => f(acc), account)),
      );

      try {
        testTransaction.after?.(scenarioAccount);
      } catch (e) {
        if (e instanceof AssertionError) {
          if (retry === 0) {
            throw e;
          }

          await new Promise(resolve => setTimeout(resolve, retryInterval || 5000));
          afterHandler(retry - 1);
        }

        throw e;
      }
    };

    afterHandler();
  }

  await scenario.afterAll?.();
}
