import type { Transaction } from "../../families/elrond/types";
import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, pickSiblings } from "../../bot/specs";
import type { AppSpec, TransactionTestInput } from "../../bot/types";
import { toOperationRaw } from "../../account";
import { DeviceModelId } from "@ledgerhq/devices";
import expect from "expect";
import { acceptTransaction } from "./speculos-deviceActions";
import BigNumber from "bignumber.js";

const currency = getCryptoCurrencyById("elrond");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");
const maxAccounts = 6;

const ELROND_MIN_ACTIVATION_SAFE = new BigNumber(10000);

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toNumber()
  );
}

const elrondSpec: AppSpec<Transaction> = {
  name: "Elrond",
  currency: getCryptoCurrencyById("elrond"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Elrond",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  minViableAmount: minimalAmount,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minimalAmount), "balance is too low");
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
    botTest("optimistic operation matches", () =>
      expect(toOperationRaw(operation)).toMatchObject(opExpected)
    );
  },
  mutations: [
    {
      name: "send 50%~",
      maxRun: 1,
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
      test: (input) => {
        expectCorrectBalanceChange(input);
      },
    },
  ],
};

export default {
  elrondSpec,
};
