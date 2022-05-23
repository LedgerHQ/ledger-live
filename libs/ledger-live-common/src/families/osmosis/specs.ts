import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";

const currency = getCryptoCurrencyById("osmosis");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.00001");
const maxAccount = 3;

const osmosis: AppSpec<Transaction> = {
  name: "Osmosis",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Cosmos",
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
          updates: [
            { recipient },
            { amount },
            Math.random() < 0.5
              ? {
                  memo: "LedgerLiveBot",
                }
              : null,
          ],
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
          updates: [
            { recipient },
            { useAllAmount: true },
            Math.random() < 0.5
              ? {
                  memo: "LedgerLiveBot",
                }
              : null,
          ],
        };
      },
    },
  ],
};

export default {
  osmosis,
};
