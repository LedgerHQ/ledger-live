import type { ElrondAccount, Transaction } from "../../families/elrond/types";
import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, pickSiblings, genericTestDestination } from "../../bot/specs";
import type { AppSpec, TransactionTestInput } from "../../bot/types";
import { toOperationRaw } from "../../account";
import { DeviceModelId } from "@ledgerhq/devices";
import expect from "expect";
import {
  acceptDelegateTransaction,
  acceptEsdtTransferTransaction,
  acceptMoveBalanceTransaction,
  acceptUndelegateTransaction,
  acceptWithdrawTransaction,
} from "./speculos-deviceActions";
import BigNumber from "bignumber.js";
import { MIN_DELEGATION_AMOUNT } from "./constants";
import { SubAccount } from "@ledgerhq/types-live";
import { sample } from "lodash";

const currency = getCryptoCurrencyById("elrond");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");
const maxAccounts = 6;

const ELROND_MIN_ACTIVATION_SAFE = new BigNumber(10000);
const UNCAPPED_PROVIDER =
  "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlhllllsr0pd0j";

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;

  botTest("EGLD balance change is correct", () =>
    expect(account.balance.toFixed()).toStrictEqual(
      accountBeforeTransaction.balance.minus(operation.value).toFixed()
    )
  );
}

function expectCorrectEsdtBalanceChange(
  input: TransactionTestInput<Transaction>
) {
  const { account, operation, accountBeforeTransaction, transaction } = input;

  const { subAccountId } = transaction;
  const subAccounts = account.subAccounts ?? [];
  const subAccountsBefore = accountBeforeTransaction.subAccounts ?? [];

  const tokenAccount = subAccounts.find((ta) => ta.id === subAccountId);
  const tokenAccountBefore = subAccountsBefore.find(
    (ta) => ta.id === subAccountId
  );

  const subOperation = operation.subOperations?.find(
    (sa) => sa.id === operation.id
  );

  if (tokenAccount && tokenAccountBefore && subOperation) {
    botTest("ESDT balance change is correct", () =>
      expect(tokenAccount.balance.toFixed()).toStrictEqual(
        tokenAccountBefore.balance.minus(subOperation.value).toFixed()
      )
    );
  }
}

function expectCorrectOptimisticOperation(
  input: TransactionTestInput<Transaction>
) {
  const { operation, optimisticOperation, transaction } = input;

  const opExpected: Record<string, any> = toOperationRaw({
    ...optimisticOperation,
  });
  delete opExpected.value;
  delete opExpected.fee;
  delete opExpected.date;
  delete opExpected.blockHash;
  delete opExpected.blockHeight;

  if (operation.type !== "OUT") {
    delete opExpected.senders;
    delete opExpected.recipients;
    delete opExpected.contract;
  }

  botTest("optimistic operation matches id", () =>
    expect(operation.id).toStrictEqual(optimisticOperation.id)
  );
  botTest("optimistic operation matches hash", () =>
    expect(operation.hash).toStrictEqual(optimisticOperation.hash)
  );
  botTest("optimistic operation matches accountId", () =>
    expect(operation.accountId).toStrictEqual(optimisticOperation.accountId)
  );

  // On ESDT transactions the fee can decrease when the transaction is executed
  if (!transaction.subAccountId) {
    botTest("optimistic operation matches fee", () =>
      expect(operation.fee.toFixed()).toStrictEqual(
        optimisticOperation.fee.toFixed()
      )
    );
  }

  botTest("optimistic operation matches type", () =>
    expect(operation.type).toStrictEqual(optimisticOperation.type)
  );
  if (operation.type === "OUT") {
    botTest("optimistic operation matches contract", () =>
      expect(operation.contract).toStrictEqual(optimisticOperation.contract)
    );
    botTest("optimistic operation matches senders", () =>
      expect(operation.senders).toStrictEqual(optimisticOperation.senders)
    );
    botTest("optimistic operation matches recipients", () =>
      expect(operation.recipients).toStrictEqual(optimisticOperation.recipients)
    );
    if (!transaction.subAccountId) {
      botTest("optimistic operation matches value", () =>
        expect(operation.value.toFixed()).toStrictEqual(
          optimisticOperation.value.toFixed()
        )
      );
    }
  }

  botTest("optimistic operation matches transactionSequenceNumber", () =>
    expect(operation.transactionSequenceNumber).toStrictEqual(
      optimisticOperation.transactionSequenceNumber
    )
  );

  botTest("raw optimistic operation matches", () =>
    expect(toOperationRaw(operation)).toMatchObject(opExpected)
  );
}

function expectCorrectSpendableBalanceChange(
  input: TransactionTestInput<Transaction>
) {
  const { account, operation, accountBeforeTransaction } = input;
  let value = operation.value;
  if (operation.type === "DELEGATE") {
    value = value.plus(new BigNumber(operation.extra.amount));
  } else if (operation.type === "WITHDRAW_UNBONDED") {
    value = value.minus(new BigNumber(operation.extra.amount));
  }

  botTest("EGLD spendable balance change is correct", () =>
    expect(account.spendableBalance.toFixed()).toStrictEqual(
      accountBeforeTransaction.spendableBalance.minus(value).toFixed()
    )
  );
}

function expectCorrectBalanceFeeChange(
  input: TransactionTestInput<Transaction>
) {
  const { account, operation, accountBeforeTransaction } = input;
  botTest("Only change on balance is fees", () =>
    expect(account.balance.toFixed()).toStrictEqual(
      accountBeforeTransaction.balance.minus(operation.fee).toFixed()
    )
  );
}

const elrondSpec: AppSpec<Transaction> = {
  name: "Elrond",
  currency: getCryptoCurrencyById("elrond"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "MultiversX",
  },
  genericDeviceAction: acceptMoveBalanceTransaction,
  genericDeviceActionForSubAccountTransfers: acceptEsdtTransferTransaction,
  testTimeout: 2 * 60 * 1000,
  minViableAmount: minimalAmount,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minimalAmount), "balance is too low");
  },
  test: (input) => {
    expectCorrectOptimisticOperation(input);
  },
  mutations: [
    {
      name: "send 50%~",
      maxRun: 1,
      deviceAction: acceptMoveBalanceTransaction,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);
        let amount = account.spendableBalance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        if (!sibling.used && amount.lt(ELROND_MIN_ACTIVATION_SAFE)) {
          invariant(
            account.spendableBalance.gt(ELROND_MIN_ACTIVATION_SAFE),
            "send is too low to activate account"
          );
          amount = ELROND_MIN_ACTIVATION_SAFE;
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              amount,
            },
          ],
        };
      },
      testDestination: genericTestDestination,
      test: (input) => {
        expectCorrectBalanceChange(input);
      },
    },
    {
      name: "send max",
      maxRun: 1,
      deviceAction: acceptMoveBalanceTransaction,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");
        const sibling = pickSiblings(siblings, maxAccounts);

        if (!sibling.used) {
          invariant(
            account.spendableBalance.gt(ELROND_MIN_ACTIVATION_SAFE),
            "send is too low to activate account"
          );
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
      testDestination: genericTestDestination,
      test: (input) => {
        expectCorrectBalanceChange(input);
      },
    },
    {
      name: "move some ESDT",
      maxRun: 1,
      deviceAction: acceptEsdtTransferTransaction,
      transaction: ({ account, siblings, bridge }) => {
        const esdtAccount: SubAccount | undefined = sample(
          (account.subAccounts || []).filter((a) => a.balance.gt(0))
        );
        invariant(esdtAccount, "no esdt account");

        invariant(esdtAccount?.balance.gt(0), "esdt balance is 0");

        const sibling = pickSiblings(siblings, 2);
        const recipient = sibling.freshAddress;

        const amount = esdtAccount?.balance.times(Math.random()).integerValue();

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              subAccountId: esdtAccount?.id,
            },
            {
              recipient,
            },
            {
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectEsdtBalanceChange(input);
        expectCorrectBalanceFeeChange(input);
      },
    },
    {
      name: "delegate 1 EGLD",
      maxRun: 1,
      deviceAction: acceptDelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(
          account.spendableBalance.gt(MIN_DELEGATION_AMOUNT),
          `spendable balance is less than minimum delegation amount`
        );

        const amount = MIN_DELEGATION_AMOUNT;

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: UNCAPPED_PROVIDER,
              mode: "delegate",
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectSpendableBalanceChange(input);
        expectCorrectBalanceFeeChange(input);
      },
    },
    {
      name: "unDelegate 1 EGLD",
      maxRun: 1,
      deviceAction: acceptUndelegateTransaction,
      transaction: ({ account, bridge }) => {
        const delegations = (account as ElrondAccount)?.elrondResources
          ?.delegations;
        invariant(delegations?.length, "account doesn't have any delegations");
        invariant(
          delegations.some((d) => new BigNumber(d.userActiveStake).gt(0)),
          "no active stake for account"
        );

        const amount = MIN_DELEGATION_AMOUNT;

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: UNCAPPED_PROVIDER,
              mode: "unDelegate",
              amount,
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectSpendableBalanceChange(input);
        expectCorrectBalanceFeeChange(input);
      },
    },
    {
      name: "withdraw all EGLD",
      maxRun: 1,
      deviceAction: acceptWithdrawTransaction,
      transaction: ({ account, bridge }) => {
        const delegations = (account as ElrondAccount)?.elrondResources
          ?.delegations;
        invariant(delegations?.length, "account doesn't have any delegations");
        invariant(
          // among all delegations
          delegations.some((d) =>
            // among all undelegating amounts
            d.userUndelegatedList?.some(
              (u) =>
                new BigNumber(u.amount).gt(0) && // the undelegation has a positive amount
                new BigNumber(u.seconds).eq(0) // the undelegation period has ended
            )
          ),
          "no withdrawable stake for account"
        );

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: UNCAPPED_PROVIDER,
              mode: "withdraw",
              amount: new BigNumber(0),
            },
          ],
        };
      },
      test: (input) => {
        expectCorrectSpendableBalanceChange(input);
        expectCorrectBalanceFeeChange(input);
      },
    },
    // TODO
    // "reDelegateRewards"
    // "claimRewards"
  ],
};

export default {
  elrondSpec,
};
