import invariant from "invariant";
import expect from "expect";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import { botTest, pickSiblings } from "../../bot/specs";
import { AppSpec, TransactionTestInput } from "../../bot/types";
import { Transaction } from "./types";
import { acceptSendTransaction } from "./speculos-deviceActions";
import { assertUnreachable } from "./utils";

const maxAccount = 1;

const helium: AppSpec<Transaction> = {
  name: "Helium",
  appQuery: {
    model: DeviceModelId.nanoS,
    firmware: "2",
    appVersion: "2.3.0",
    appName: "TNT",
  },
  genericDeviceAction: acceptSendTransaction,
  testTimeout: 15 * 60 * 1000,
  currency: getCryptoCurrencyById("helium_testnet"),
  mutations: [
    {
      name: "Send ~50%",
      maxRun: 2,
      deviceAction: acceptSendTransaction,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = account.spendableBalance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();
        return {
          transaction,
          updates: [{ recipient }, { amount }, SendMemo()],
        };
      },
      test: (input) => {
        expectCorrectBalanceChange(input);
      },
    },
    {
      name: "Send Max",
      maxRun: 1,
      deviceAction: acceptSendTransaction,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction,
          updates: [{ recipient }, { useAllAmount: true }, SendMemo()],
        };
      },
      test: (input) => {
        const { account } = input;
        botTest("account balance should be zero", () =>
          expect(account.spendableBalance.toNumber()).toBe(0)
        );
        expectCorrectBalanceChange(input);
      },
    },
  ],
};

function SendMemo(): Partial<Transaction> | undefined {
  return {
    model: {
      mode: "send",
      memo: "A memo",
    },
  };
}

// TODO: Add more tests once voting is implemented
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Burn(): Partial<Transaction> | undefined {
  return {
    model: {
      mode: "burn",
      payee: "13qVx7MRzocyKZ4bW3oEkvnQrTK4DftKEcjHVYP1zhMtUhnqYye",
      memo: "0",
      hipID: "14MnuexopPfDg3bmq8JdCm7LMDkUBoqhqanD9QzLrUURLZxFHBx",
    },
  };
}

// TODO: Add more tests once voting is implemented
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function expectCorrectMemo(input: TransactionTestInput<Transaction>) {
  const { transaction, operation } = input;
  switch (transaction.model.mode) {
    case "send": {
      const memo = transaction.model.memo;
      botTest("memo matches in op extra", () =>
        expect(operation.extra.memo).toBe(memo)
      );
      break;
    }
    default:
      return assertUnreachable();
  }
}

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  botTest("account balance decreased with operation value", () => {
    const balance = Math.floor(
      accountBeforeTransaction.balance.minus(operation.value).toNumber()
    );
    expect(account.spendableBalance.toNumber()).toBe(balance);
  });
}

export default {
  helium,
};
