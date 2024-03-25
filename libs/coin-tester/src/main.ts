import {
  AccountBridge,
  Account,
  TransactionCommon,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import { AssertionError } from "assert";
import { first, firstValueFrom, map, reduce } from "rxjs";

type Scenario<T extends TransactionCommon> = {
  setup: () => Promise<{
    accountBridge: AccountBridge<T>;
    account: Account;
    onSignerConfirmation?: () => Promise<void>;
  }>;
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  transactions: (T & { after?: (account: Account) => void })[];
  teardown?: () => void;
};

export async function executeScenario<T extends TransactionCommon>(scenario: Scenario<T>) {
  const { accountBridge, account, onSignerConfirmation } = await scenario.setup();
  await scenario.beforeAll?.();

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

    // TODO: throw error if error in status ?
    const status = await accountBridge.getTransactionStatus(scenarioAccount, transaction);

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

          await new Promise(resolve => setTimeout(resolve, 5000));
          afterHandler(retry - 1);
        }

        throw e;
      }
    };

    afterHandler();
  }

  await scenario.afterAll?.();
}
