import invariant from "invariant";
import expect from "expect";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import { pickSiblings } from "../../bot/specs";
import { AppSpec, TransactionTestInput } from "../../bot/types";
import { Transaction } from "./types";
import { acceptTransferTransaction } from "./speculos-deviceActions";
import { assertUnreachable } from "./utils";

const solana: AppSpec<Transaction> = {
  name: "Solana",
  appQuery: {
    model: DeviceModelId.nanoS,
    firmware: "2",
    appName: "solana",
  },
  currency: getCryptoCurrencyById("solana"),
  mutations: [
    {
      name: "Transfer ~50%",
      maxRun: 2,
      deviceAction: acceptTransferTransaction,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings);
        const recipient = sibling.freshAddress;
        const amount = account.balance.div(1.9 + 0.2 * Math.random());
        return {
          transaction,
          updates: [{ recipient }, { amount }, maybeTransferMemo()],
        };
      },
      test: (input) => {
        expectCorrectBalanceChange(input);
        expectCorrectMemo(input);
      },
    },
    {
      name: "Transfer Max",
      maxRun: 1,
      deviceAction: acceptTransferTransaction,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings);
        const recipient = sibling.freshAddress;
        return {
          transaction,
          updates: [{ recipient }, { useAllAmount: true }, maybeTransferMemo()],
        };
      },
      test: (input) => {
        const { account } = input;
        expect(account.balance.toNumber()).toBe(0);
        expectCorrectBalanceChange(input);
        expectCorrectMemo(input);
      },
    },
  ],
};

function maybeTransferMemo(threshold = 0.5): Partial<Transaction> | undefined {
  return Math.random() > threshold
    ? {
        model: {
          kind: "transfer",
          uiState: {
            memo: "a memo",
          },
        },
      }
    : undefined;
}

function expectCorrectMemo(input: TransactionTestInput<Transaction>) {
  const { transaction, operation } = input;
  switch (transaction.model.kind) {
    case "transfer":
    case "token.transfer":
      expect(operation.extra.memo).toBe(transaction.model.uiState.memo);
      break;
    case "token.createATA":
      break;
    default:
      return assertUnreachable(transaction.model);
  }
}

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  expect(account.balance.toNumber()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toNumber()
  );
}

export default {
  solana,
};
