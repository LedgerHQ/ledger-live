import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");
const maxAccount = 3;

const celo: AppSpec<Transaction> = {
  name: "Celo",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Celo",
  },
  testTimeout: 2 * 60 * 1000,
  mutations: [
    {
      name: "move 50% to another account",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient }, { amount }],
        };
      },
    },
    {
      name: "send max to another account",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minimalAmount), "balance is too low");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient }, { useAllAmount: true }],
        };
      },
    },
  ],
};

export default {
  celo,
};
