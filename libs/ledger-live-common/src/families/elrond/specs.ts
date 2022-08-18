import type { Transaction } from "../../families/elrond/types";
import invariant from "invariant";
import { getCryptoCurrencyById } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec, TransactionTestInput } from "../../bot/types";
import { toOperationRaw } from "../../account";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import expect from "expect";
import {
  acceptEsdtTransferTransaction,
  acceptMoveBalanceTransaction,
} from "./speculos-deviceActions";
import { sample } from "lodash";
import { SubAccount } from "@ledgerhq/types-live";

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toNumber()
  );
}

const ELROND_MIN_SAFE = new BigNumber(10000);

const elrondSpec: AppSpec<Transaction> = {
  name: "Elrond",
  currency: getCryptoCurrencyById("elrond"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Elrond",
  },
  testTimeout: 2 * 60 * 1000,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(ELROND_MIN_SAFE), "balance is too low");
  },
  test: ({ operation, optimisticOperation }) => {
    const opExpected: Record<string, any> = toOperationRaw({
      ...optimisticOperation,
    });
    operation.extra = opExpected.extra;
    delete opExpected.value;
    delete opExpected.fee;
    delete opExpected.date;
    delete opExpected.blockHash;
    delete opExpected.blockHeight;
    expect(toOperationRaw(operation)).toMatchObject(opExpected);
  },

  mutations: [
    {
      name: "send 50%~",
      maxRun: 1,
      deviceAction: acceptMoveBalanceTransaction,
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.spendableBalance.gt(0), "balance is 0");

        const sibling = pickSiblings(siblings, 2);
        let amount = account.spendableBalance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        if (!sibling.used && amount.lt(ELROND_MIN_SAFE)) {
          invariant(
            account.spendableBalance.gt(ELROND_MIN_SAFE),
            "send is too low to activate account"
          );
          amount = ELROND_MIN_SAFE;
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: pickSiblings(siblings, 1).freshAddress,
            },
            {
              amount,
            },
          ],
        };
      },
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

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient,
              subAccountId: esdtAccount?.id,
            },
            {
              amount: esdtAccount?.balance.times(Math.random()).integerValue(),
            },
          ],
        };
      },
    },
  ],
};

export default {
  elrondSpec,
};
