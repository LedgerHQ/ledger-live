import chalk from "chalk";
import { Account, AccountBridge, SignOperationEvent, TransactionCommon } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { first, firstValueFrom, map } from "rxjs";
import { Scenario, ScenarioTransaction } from "./main";

export type RejectionScenarioTransaction<
  T extends TransactionCommon,
  A extends Account,
> = ScenarioTransaction<T, A> & {
  expectBroadcast: "reject";
  expectRejectContains: string;
};

export async function executeRejectionScenario<T extends TransactionCommon, A extends Account>(
  scenario: Scenario<T, A>,
  testTransaction: RejectionScenarioTransaction<T, A>,
): Promise<void> {
  const { accountBridge, account, onSignerConfirmation } = await scenario.setup("legacy");

  let scenarioAccount = account;

  await scenario.beforeEach?.(scenarioAccount);
  await testTransaction.setupChainState?.();

  let signedTxHex: string;

  if (testTransaction.signedTxOverride) {
    signedTxHex = testTransaction.signedTxOverride;
  } else {
    const defaultTransaction = accountBridge.createTransaction(scenarioAccount);
    const transaction = await accountBridge.prepareTransaction(scenarioAccount, {
      ...defaultTransaction,
      ...testTransaction,
    } as T);

    const { signedOperation } = await firstValueFrom(
      accountBridge
        .signOperation({
          account: scenarioAccount,
          transaction,
          deviceId: "",
          deviceModelId: DeviceModelId.nanoX,
          certificateSignatureKind: "prod",
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

    signedTxHex = signedOperation.signature;
  }

  let caught: Error | undefined;

  try {
    await accountBridge.broadcast({
      signedOperation: {
        operation: {
          hash: "",
          type: "OUT",
          value: scenarioAccount.balance,
          fee: scenarioAccount.balance,
          blockHash: null,
          blockHeight: null,
          senders: [scenarioAccount.freshAddress],
          recipients: [],
          accountId: scenarioAccount.id,
          date: new Date(),
          extra: {},
        },
        signature: signedTxHex,
        rawData: undefined,
      },
      account: scenarioAccount,
    });
  } catch (err) {
    caught = err as Error;
  }

  if (!caught) {
    throw new Error(
      `${testTransaction.name}: expected broadcast rejection containing "${testTransaction.expectRejectContains}" but broadcast succeeded`,
    );
  }

  const message = caught.message ?? String(caught);
  if (!message.toLowerCase().includes(testTransaction.expectRejectContains.toLowerCase())) {
    throw new Error(
      `${testTransaction.name}: expected rejection containing "${testTransaction.expectRejectContains}", got: ${message}`,
    );
  }

  if (testTransaction.expectErrorClass && caught.name !== testTransaction.expectErrorClass) {
    throw new Error(
      `${testTransaction.name}: expected error class "${testTransaction.expectErrorClass}", got "${caught.name}" (${message})`,
    );
  }

  console.log(
    chalk.green(
      `Rejection scenario "${testTransaction.name}" passed:`,
      testTransaction.expectRejectContains,
    ),
  );

  await scenario.afterEach?.(scenarioAccount);
  await scenario.teardown?.();
}
