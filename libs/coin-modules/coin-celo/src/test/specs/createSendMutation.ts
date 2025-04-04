import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { MutationSpec } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../../types";

const maxAccount = 10;
const currency = getCryptoCurrencyById("celo");
export const minimalAmount = parseCurrencyUnit(currency.units[0], "0.01");

export const createSend50PercentMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Move 50% to another account",
  feature: "send",
  maxRun: 1,
  transaction: ({ account, siblings, bridge, maxSpendable }) => {
    invariant(maxSpendable.gt(minimalAmount), "Celo:  Move 50% | balance is too low");
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
  feature: "sendMax",
  maxRun: 1,
  transaction: ({ account, siblings, bridge, maxSpendable }) => {
    invariant(maxSpendable.gt(minimalAmount), "Celo: Send Max | Balance is too low");
    const sibling = pickSiblings(siblings, maxAccount);
    const recipient = sibling.freshAddress;
    return {
      transaction: bridge.createTransaction(account),
      updates: [{ recipient }, { useAllAmount: true }],
    };
  },
});
