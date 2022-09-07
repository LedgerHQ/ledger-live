import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { pickSiblings } from "../../../bot/specs";
import { MutationSpec } from "../../../bot/types";
import type { Transaction } from "../types";

const maxAccount = 3;
const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createSend50PercentMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Move 50% to another account",
  maxRun: 1,
  transaction: ({ account, siblings, bridge, maxSpendable }) => {
    invariant(
      maxSpendable.gt(minimalAmount),
      "Celo:  Move 50% | balance is too low"
    );
    const sibling = pickSiblings(siblings, maxAccount);
    const recipient = sibling.freshAddress;
    const amount = maxSpendable.div(2).integerValue();
    return {
      transaction: bridge.createTransaction(account),
      updates: [{ recipient }, { amount }],
    };
  },
});

export const createSendMaxMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Send max to another account",
  maxRun: 1,
  transaction: ({ account, siblings, bridge, maxSpendable }) => {
    invariant(
      maxSpendable.gt(minimalAmount),
      "Celo: Send Max | Balance is too low"
    );
    const sibling = pickSiblings(siblings, maxAccount);
    const recipient = sibling.freshAddress;
    return {
      transaction: bridge.createTransaction(account),
      updates: [{ recipient }, { useAllAmount: true }],
    };
  },
});
